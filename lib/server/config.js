import dotenv from "dotenv"

dotenv.config()

function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getNumberEnv(name, fallback) {
  const value = process.env[name]

  if (!value) return fallback

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`)
  }

  return parsed
}

export const config = {
  geminiApiKey: getRequiredEnv("GEMINI_API_KEY"),
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "models/gemini-embedding-2-preview",
  geminiEmbeddingDimension: getNumberEnv("GEMINI_EMBEDDING_DIMENSION", 3072),
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  supabaseUrl: getRequiredEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  documentsTable: process.env.SUPABASE_DOCUMENTS_TABLE || "documents",
  matchFunction: process.env.SUPABASE_MATCH_FUNCTION || "match_documents",
  chunkSize: getNumberEnv("CHUNK_SIZE", 1400),
  chunkOverlap: getNumberEnv("CHUNK_OVERLAP", 200),
  queryMatchCount: getNumberEnv("QUERY_MATCH_COUNT", 6),
}
