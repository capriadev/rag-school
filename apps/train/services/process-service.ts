import fs from "node:fs/promises"
import { insertDocuments } from "../api/db.js"
import { getTrainWebhookUrl } from "../lib/config.js"
import { touchProcessJob, type ProcessJob } from "../lib/process-jobs.js"

type N8NChunk = {
  content?: string
  text?: string
  metadata?: Record<string, unknown>
  embedding?: number[]
}

type N8NResponse = {
  chunks?: N8NChunk[]
  [key: string]: unknown
}

function toInsertPayload(chunks: N8NChunk[], profileId: string, source: string) {
  return chunks.map((chunk) => ({
    id_profile: Number.parseInt(profileId, 10),
    content: chunk.content || chunk.text || "",
    metadata: chunk.metadata || { source },
    embedding: chunk.embedding || [],
  }))
}

async function finalizeJobWithN8NResult(job: ProcessJob, result: N8NResponse, source: string) {
  const chunks = Array.isArray(result.chunks) ? result.chunks : []

  if (!chunks.length) {
    job.status = "completed"
    job.result = result
    touchProcessJob(job)
    console.log(`[N8N] Job ${job.id} completado (sin chunks para insertar)`)
    return
  }

  console.log(`[DB] Insertando ${chunks.length} chunks en Supabase...`)
  const documents = toInsertPayload(chunks, job.profileId, source)
  const { inserted } = await insertDocuments(documents)

  job.status = "completed"
  job.result = {
    ...result,
    inserted,
    message: `${inserted} documentos insertados en el perfil ${job.profileId}`,
  }
  touchProcessJob(job)

  console.log(`[DB] Job ${job.id} completado: ${inserted} documentos insertados`)
}

export async function sendTextToN8N(job: ProcessJob, text: string) {
  const webhook = getTrainWebhookUrl()

  try {
    job.status = "processing"
    touchProcessJob(job)

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        profileId: job.profileId,
        jobId: job.id,
        source: "text-upload",
      }),
    })

    if (!response.ok) {
      throw new Error(`n8n respondio ${response.status}: ${await response.text()}`)
    }

    const result = (await response.json()) as N8NResponse
    await finalizeJobWithN8NResult(job, result, "text-upload")
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    console.error(`[PROCESS ERROR] Job ${job.id}:`, error)
    job.status = "failed"
    job.error = message
    touchProcessJob(job)
    throw error
  }
}

export async function sendFileToN8N(job: ProcessJob, filename: string) {
  const webhook = getTrainWebhookUrl()

  try {
    job.status = "processing"
    touchProcessJob(job)

    const formData = new FormData()
    const fileBuffer = await fs.readFile(job.filePath)
    const blob = new Blob([fileBuffer])

    formData.append("file", blob, filename)
    formData.append("profileId", job.profileId)
    formData.append("jobId", job.id)
    formData.append("webhookResponse", "true")

    const response = await fetch(webhook, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`n8n respondio ${response.status}: ${await response.text()}`)
    }

    const result = (await response.json()) as N8NResponse
    await finalizeJobWithN8NResult(job, result, filename)
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    console.error(`[PROCESS ERROR] Job ${job.id}:`, error)
    job.status = "failed"
    job.error = message
    touchProcessJob(job)
  }
}
