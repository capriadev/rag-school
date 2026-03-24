import Groq from "groq-sdk"
import { CHUNK_OPTIONS, MODEL_BY_CHUNKS } from "../shared/llm"
import { config } from "./config"

const groqClients = config.groqApiKeys.map((apiKey) => new Groq({ apiKey }))

function selectModel(chunkCount) {
  const closest = CHUNK_OPTIONS.reduce((previous, current) =>
    Math.abs(current - chunkCount) < Math.abs(previous - chunkCount) ? current : previous,
  )

  return MODEL_BY_CHUNKS[closest] ?? config.groqModel
}

function buildPrompt({ question, contexts }) {
  return [
    "Sos un asistente RAG de alta precision.",
    "Responde unicamente con informacion presente en el contexto recuperado.",
    "No inventes, no completes con conocimiento externo y no supongas datos faltantes.",
    "Si el contexto no alcanza para responder, responde exactamente: No se encontro informacion relevante en las fuentes.",
    "Si la pregunta pide pasos, listas o comparaciones, responde con formato Markdown claro.",
    "Responde en espanol, de forma directa, precisa y util.",
    "",
    "Contexto:",
    contexts.length ? contexts.join("\n\n---\n\n") : "Sin contexto disponible.",
    "",
    `Pregunta: ${question}`,
  ].join("\n")
}

export async function generateAnswer({ question, contexts, chunkCount }) {
  if (!groqClients.length) {
    throw new Error("No hay proveedor de respuesta disponible. Configura GROQ_API_KEY.")
  }

  const model = selectModel(chunkCount ?? contexts.length)
  const errors = []

  for (const [index, client] of groqClients.entries()) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: buildPrompt({ question, contexts }),
          },
        ],
      })

      return completion.choices?.[0]?.message?.content || "No se pudo generar una respuesta."
    } catch (error) {
      errors.push(`GROQ_API_KEY_${index + 1}: ${error.message || "unknown error"}`)
    }
  }

  throw new Error(`All Groq providers failed. ${errors.join(" | ")}`)
}
