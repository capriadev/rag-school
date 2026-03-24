import { GoogleGenAI } from "@google/genai"
import { config } from "./config"

const geminiClients = config.geminiApiKeys.map((apiKey) => new GoogleGenAI({ apiKey }))

export async function embedTexts(texts, taskType) {
  if (!texts.length) return []

  const errors = []

  for (const [index, client] of geminiClients.entries()) {
    try {
      const response = await client.models.embedContent({
        model: config.geminiEmbeddingModel,
        contents: texts,
        config: {
          taskType,
          outputDimensionality: config.geminiEmbeddingDimension,
        },
      })

      return (response.embeddings || []).map((item) => item.values || [])
    } catch (error) {
      errors.push(`GEMINI_API_KEY_${index + 1}: ${error.message || "unknown error"}`)
    }
  }

  throw new Error(`All Gemini providers failed. ${errors.join(" | ")}`)
}
