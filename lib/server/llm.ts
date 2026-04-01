import Groq from "groq-sdk"
import { CHUNK_OPTIONS, DEFAULT_CHUNK_COUNT, MODEL_ROTATION_BY_CHUNKS } from "../shared/llm"
import { config } from "./config"

const groqClients = config.groqApiKeys.map((apiKey) => new Groq({ apiKey }))

function resolveModelRotation(chunkCount: number): string[] {
  const closest = CHUNK_OPTIONS.reduce((previous, current) =>
    Math.abs(current - chunkCount) < Math.abs(previous - chunkCount) ? current : previous,
  )

  return MODEL_ROTATION_BY_CHUNKS[closest] ?? MODEL_ROTATION_BY_CHUNKS[DEFAULT_CHUNK_COUNT]
}

function buildPrompt({
  question,
  contexts,
  context,
}: {
  question: string
  contexts: string[]
  context?: Array<{ role: "user" | "assistant"; content: string }>
}): string {
  const conversationHistory = context && context.length > 0
    ? context.map(m => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`).join("\n\n")
    : ""

  return [
    "Sos un asistente RAG de alta precision.",
    "Responde unicamente con informacion presente en el contexto recuperado.",
    "No inventes, no completes con conocimiento externo y no supongas datos faltantes.",
    "Si el contexto no alcanza para responder, responde exactamente: No se encontro informacion relevante en las fuentes.",
    "Si la pregunta pide pasos, listas o comparaciones, responde con formato Markdown claro.",
    "Responde en espanol, de forma directa, precisa y util.",
    conversationHistory ? `\nHistorial de conversacion:\n${conversationHistory}\n` : "",
    "",
    "Contexto:",
    contexts.length ? contexts.join("\n\n---\n\n") : "Sin contexto disponible.",
    "",
    `Pregunta: ${question}`,
  ].join("\n")
}

export async function generateAnswer({
  question,
  contexts,
  chunkCount,
  context,
}: {
  question: string
  contexts: string[]
  chunkCount?: number
  context?: Array<{ role: "user" | "assistant"; content: string }>
}): Promise<string> {
  if (!groqClients.length) {
    throw new Error("No hay proveedor de respuesta disponible. Configura GROQ_API_KEY.")
  }

  const modelRotation = resolveModelRotation(chunkCount ?? contexts.length)
  const errors = []

  for (const model of modelRotation) {
    for (const [index, client] of groqClients.entries()) {
      try {
        const completion = await client.chat.completions.create({
          model,
          temperature: 0.2,
          messages: [
            {
              role: "user",
              content: buildPrompt({ question, contexts, context }),
            },
          ],
        })

        return completion.choices?.[0]?.message?.content || "No se pudo generar una respuesta."
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error"
        errors.push(`${model} via GROQ_API_KEY_${index + 1}: ${message}`)
      }
    }
  }

  throw new Error(`All Groq providers failed. ${errors.join(" | ")}`)
}
