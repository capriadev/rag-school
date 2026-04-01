import dotenv from "dotenv"

dotenv.config()

function getEnv(name: string): string {
  return process.env[name]?.trim() || ""
}

function getRequiredEnv(name: string): string {
  const value = getEnv(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getSequentialEnvGroup(baseName: string): string[] {
  const values: string[] = []
  let index = 1

  while (true) {
    const name = index === 1 ? baseName : `${baseName}_${index}`
    const value = getEnv(name)

    if (!value) {
      break
    }

    values.push(value)
    index += 1
  }

  return values
}

function getRequiredSequentialEnvGroup(baseName: string): string[] {
  const values = getSequentialEnvGroup(baseName)

  if (!values.length) {
    throw new Error(`Missing required environment variables for group: ${baseName}`)
  }

  return values
}

export const config = {
  geminiApiKeys: getRequiredSequentialEnvGroup("GEMINI_API_KEY"),
  groqApiKeys: getSequentialEnvGroup("GROQ_API_KEY"),
  supabaseUrl: getRequiredEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  documentsTable: process.env.SUPABASE_DOCUMENTS_TABLE || "documents",
  matchFunction: process.env.SUPABASE_MATCH_FUNCTION || "match_documents",
}
