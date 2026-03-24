export const DEFAULT_CHUNK_COUNT = 3
export const CHUNK_OPTIONS: number[] = [1, 3, 5, 7, 9, 15]

export const GROQ_MODELS = {
  fast: "llama-3.1-8b-instant",
  balanced: "meta-llama/llama-4-scout-17b-16e-instruct",
  deep: "llama-3.3-70b-versatile",
} as const

export const MODEL_ROTATION_BY_CHUNKS: Record<number, string[]> = {
  1: [GROQ_MODELS.fast, GROQ_MODELS.balanced, GROQ_MODELS.deep],
  3: [GROQ_MODELS.fast, GROQ_MODELS.balanced, GROQ_MODELS.deep],
  5: [GROQ_MODELS.balanced, GROQ_MODELS.deep, GROQ_MODELS.fast],
  7: [GROQ_MODELS.balanced, GROQ_MODELS.deep, GROQ_MODELS.fast],
  9: [GROQ_MODELS.deep, GROQ_MODELS.balanced, GROQ_MODELS.fast],
  15: [GROQ_MODELS.deep, GROQ_MODELS.balanced, GROQ_MODELS.fast],
}
