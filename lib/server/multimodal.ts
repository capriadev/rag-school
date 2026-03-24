import { GoogleGenAI, createPartFromBase64 } from "@google/genai"
import { config } from "./config"
import type { SourceInput } from "../shared/types"

const MULTIMODAL_MODEL = "gemini-2.5-flash"
const geminiClients = config.geminiApiKeys.map((apiKey) => new GoogleGenAI({ apiKey }))

function buildExtractionPrompt(kind: SourceInput["sourceType"], fileName: string): string {
  const baseInstructions = [
    "Extrae informacion util para indexar en una base RAG.",
    "Responde solo con texto plano.",
    "Si hay texto legible, transcribelo primero.",
    "Luego agrega contexto semantico breve y fiel al contenido.",
    "No inventes detalles que no esten presentes.",
    `Archivo: ${fileName}`,
  ]

  const kindInstructions: Record<SourceInput["sourceType"], string> = {
    text: "Convierte el contenido a texto limpio.",
    pdf: "Extrae el texto principal del documento.",
    csv: "Resume el contenido tabular preservando columnas y filas relevantes.",
    spreadsheet: "Extrae encabezados, filas clave y hojas relevantes.",
    presentation: "Extrae texto visible por diapositiva y notas importantes.",
    image: "Extrae texto visible y describe elementos visuales relevantes para busqueda.",
    audio: "Transcribe el audio y resume los temas principales.",
    video: "Transcribe o resume el video con foco en texto, locucion y escenas relevantes.",
  }

  return [...baseInstructions, kindInstructions[kind]].join("\n")
}

export async function extractMultimodalText(params: {
  buffer: Buffer
  fileName: string
  mimeType: string
  sourceType: Extract<SourceInput["sourceType"], "image" | "audio" | "video">
}): Promise<string> {
  const { buffer, fileName, mimeType, sourceType } = params
  const filePart = createPartFromBase64(buffer.toString("base64"), mimeType)
  const errors: string[] = []

  for (const [index, client] of geminiClients.entries()) {
    try {
      const response = await client.models.generateContent({
        model: MULTIMODAL_MODEL,
        contents: [buildExtractionPrompt(sourceType, fileName), filePart],
      })

      return response.text?.trim() || ""
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error"
      errors.push(`GEMINI_API_KEY_${index + 1}: ${message}`)
    }
  }

  throw new Error(`No se pudo extraer texto multimodal. ${errors.join(" | ")}`)
}
