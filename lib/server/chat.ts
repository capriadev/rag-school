import { GoogleGenAI } from "@google/genai"
import { config } from "./config"

const GEMMA_MODEL = "models/gemma-3-27b-it"

const SYSTEM_PROMPT = `Eres un asistente de chat conciso y directo.

REGLAS:
- Sé ultra breve. Responde en pocas palabras, máximo 2-3 oraciones.
- No inventes información. Si no sabes algo, di "No sé de eso" y haz preguntas al usuario para aclarar.
- Nunca afirmes ciegamente lo que dice el usuario. Analiza con criterio real y fundamentos.
- No des explicaciones largas ni justificaciones innecesarias.

CONTEXTO DEL PROYECTO:
- Trabajas en "RAG Custom", una plataforma de asistentes inteligentes.
- Tú eres el modo "Chat": un asistente de conversación general SIN acceso a documentos ni bases de conocimiento (RAG).
- Si el usuario pregunta por documentos, datos específicos o información almacenada, indícale que debe usar el modo RAG seleccionando un perfil en el dropdown.`

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
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Entendido. Seré breve, directo y honesto sobre lo que sé y no sé." }],
        },
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
