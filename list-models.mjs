import { GoogleGenAI } from "@google/genai"
import dotenv from "dotenv"

dotenv.config()

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env")
    process.exit(1)
  }

  const client = new GoogleGenAI({ apiKey })

  try {
    console.log("Fetching available models...\n")
    const pager = await client.models.list()
    const models = []
    for await (const model of pager) {
      models.push(model)
    }
    
    console.log(`Found ${models.length} models:\n`)
    for (const model of models) {
      console.log(`- ${model.name}`)
      if (model.description) {
        console.log(`  Description: ${model.description}`)
      }
      console.log("")
    }
  } catch (error) {
    console.error("Error listing models:", error)
  }
}

listModels()
