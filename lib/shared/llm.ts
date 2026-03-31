export const DEFAULT_CHUNK_COUNT = 5
export const CHUNK_OPTIONS: number[] = [3, 5, 7, 9, 12, 15]
export const CHUNK_OPTIONS_DEBUG: number[] = [1, 3, 5, 7, 9, 12, 15]

export const CHUNK_LABELS: Record<number, string> = {
  1: "Debug",
  3: "Preciso",
  5: "Balanceado",
  7: "Completo",
  9: "Amplio",
  12: "Extendido",
  15: "Exhaustivo",
}

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
  12: [GROQ_MODELS.deep, GROQ_MODELS.balanced, GROQ_MODELS.fast],
  15: [GROQ_MODELS.deep, GROQ_MODELS.balanced, GROQ_MODELS.fast],
}
