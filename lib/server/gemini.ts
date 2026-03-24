import { GoogleGenAI } from "@google/genai"
import { config } from "./config"

const geminiClients = config.geminiApiKeys.map((apiKey) => new GoogleGenAI({ apiKey }))

export async function embedTexts(texts: string[], taskType: string): Promise<number[][]> {
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
      const message = error instanceof Error ? error.message : "unknown error"
      errors.push(`GEMINI_API_KEY_${index + 1}: ${message}`)
    }
  }

  throw new Error(`All Gemini providers failed. ${errors.join(" | ")}`)
}
