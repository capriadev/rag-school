import { GoogleGenAI } from "@google/genai"
import { config } from "./config"

const GEMMA_MODEL = "models/gemma-3-27b-it"

const SYSTEM_PROMPT = `Eres un asistente de chat conciso y directo.

REGLAS:
- Sé ultra breve. Responde en pocas palabras, máximo 2-3 oraciones.
- No inventes información. Si no sabes algo, di "No sé de eso" y haz preguntas al usuario para aclarar.
- Nunca afirmes ciegamente lo que dice el usuario. Analiza con criterio real y fundamentos.
- No des explicaciones largas ni justificaciones innecesarias.

FORMATO DE RESPUESTA:
- Puedes usar Markdown para formatear tu respuesta: **negrita**, *cursiva*, listas, código, etc.
- Puedes usar LaTeX para fórmulas matemáticas: $x^2 + y^2 = z^2$ para inline o $$...$$ para bloques.
- Usa el formato cuando ayude a clarificar tu respuesta.

CONTEXTO DEL PROYECTO:
- Trabajas en "RAG Custom", una plataforma de asistentes inteligentes.
- Tú eres el modo "Chat": un asistente de conversación general SIN acceso a documentos ni bases de conocimiento (RAG).
- Si el usuario pregunta por documentos, datos específicos o información almacenada, indícale que debe usar el modo RAG seleccionando un perfil en el dropdown.`

export async function generateChatResponse(
  message: string,
  context?: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  const apiKey = config.geminiApiKeys[0]
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada")
  }

  const client = new GoogleGenAI({ apiKey })

  // Build contents array with system prompt + context + current message
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [
    {
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }],
    },
    {
      role: "model",
      parts: [{ text: "Entendido. Seré breve, directo y honesto sobre lo que sé y no sé." }],
    },
  ]

  // Add conversation context if provided
  if (context && context.length > 0) {
    for (const msg of context) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })
    }
  }

  // Add current message
  contents.push({
    role: "user",
    parts: [{ text: message }],
  })

  try {
    const response = await client.models.generateContent({
      model: GEMMA_MODEL,
      contents,
    })

    return response.text || "No se pudo generar una respuesta."
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    throw new Error(`Gemma chat failed: ${errorMessage}`)
  }
}

export async function* generateChatResponseStream(
  message: string,
  context?: Array<{ role: "user" | "assistant"; content: string }>,
): AsyncGenerator<string, void, unknown> {
  const apiKey = config.geminiApiKeys[0]
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada")
  }

  const client = new GoogleGenAI({ apiKey })

  // Build contents array with system prompt + context + current message
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [
    {
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }],
    },
    {
      role: "model",
      parts: [{ text: "Entendido. Seré breve, directo y honesto sobre lo que sé y no sé." }],
    },
  ]

  // Add conversation context if provided
  if (context && context.length > 0) {
    for (const msg of context) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })
    }
  }

  // Add current message
  contents.push({
    role: "user",
    parts: [{ text: message }],
  })

  try {
    const response = await client.models.generateContentStream({
      model: GEMMA_MODEL,
      contents,
    })

    for await (const chunk of response) {
      const text = chunk.text
      if (text) {
        yield text
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    throw new Error(`Gemma chat stream failed: ${errorMessage}`)
  }
}
