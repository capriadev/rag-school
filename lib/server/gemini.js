import { GoogleGenAI } from "@google/genai"
import { config } from "./config"

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey })

export async function embedTexts(texts, taskType) {
  if (!texts.length) return []

  const response = await ai.models.embedContent({
    model: config.geminiEmbeddingModel,
    contents: texts,
    config: {
      taskType,
      outputDimensionality: config.geminiEmbeddingDimension,
    },
  })

  return (response.embeddings || []).map((item) => item.values || [])
}

export async function generateGeminiAnswer({ question, contexts }) {
  const prompt = [
    "Sos un asistente que responde solo con la informacion provista.",
    "Si no hay suficiente contexto, decilo con claridad y sin inventar.",
    "Responde en espanol.",
    "",
    "Contexto:",
    contexts.length ? contexts.join("\n\n---\n\n") : "Sin contexto disponible.",
    "",
    `Pregunta: ${question}`,
  ].join("\n")

  const response = await ai.models.generateContent({
    model: config.geminiLlmModel,
    contents: prompt,
  })

  return response.text || "No se pudo generar una respuesta."
}
