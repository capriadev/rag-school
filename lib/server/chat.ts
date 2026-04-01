import { GoogleGenAI } from "@google/genai"
import { config } from "./config"

const GEMMA_MODEL = "gemma-3-24b-it"

export async function generateChatResponse(message: string): Promise<string> {
  const apiKey = config.geminiApiKeys[0]
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada")
  }

  const client = new GoogleGenAI({ apiKey })

  try {
    const response = await client.models.generateContent({
      model: GEMMA_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    })

    return response.text || "No se pudo generar una respuesta."
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    throw new Error(`Gemma chat failed: ${errorMessage}`)
  }
}
