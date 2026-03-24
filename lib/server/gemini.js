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
