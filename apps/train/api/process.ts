import { Router } from "express"
import path from "node:path"
import fs from "node:fs/promises"
import { insertDocuments } from "./db.js"
import { TRAIN_UPLOADS_DIR, getTrainWebhookUrl } from "../lib/config.js"
import { createProcessJob, getProcessJob, listProcessJobs, touchProcessJob, type ProcessJob } from "../lib/process-jobs.js"

const router = Router()

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

router.post("/", async (req, res) => {
  try {
    const { fileId, profileId } = req.body as { fileId?: string; profileId?: string }

    if (!fileId || !profileId) {
      return res.status(400).json({
        error: "Se requieren fileId y profileId",
        example: { fileId: "123456789-nombre.pdf", profileId: "1" },
      })
    }

    const files = await fs.readdir(TRAIN_UPLOADS_DIR)
    const matchingFile = files.find((file) => file.includes(fileId))

    if (!matchingFile) {
      return res.status(404).json({ error: `Archivo no encontrado: ${fileId}` })
    }

    const filePath = path.join(TRAIN_UPLOADS_DIR, matchingFile)
    const job = createProcessJob({ filePath, profileId })

    try {
      await sendFileToN8N(job, matchingFile)
    } catch (error) {
      console.error("[PROCESS] Error enviando a n8n:", error)
    }

    console.log(`[PROCESS] Job ${job.id} creado para ${matchingFile} -> perfil ${profileId}`)

    return res.json({
      success: true,
      jobId: job.id,
      status: "pending",
      message: "Archivo enviado a procesamiento",
      checkStatus: `GET /api/process/status?jobId=${job.id}`,
    })
  } catch (error) {
    console.error("[PROCESS ERROR]", error)
    return res.status(500).json({ error: "Error al iniciar procesamiento" })
  }
})

router.get("/status", (req, res) => {
  const { jobId } = req.query

  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Se requiere jobId" })
  }

  const job = getProcessJob(jobId)
  if (!job) {
    return res.status(404).json({ error: "Job no encontrado" })
  }

  return res.json({
    id: job.id,
    status: job.status,
    profileId: job.profileId,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  })
})

router.get("/jobs", (req, res) => {
  const jobs = listProcessJobs().sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })

  return res.json({
    count: jobs.length,
    jobs,
  })
})

router.post("/text", async (req, res) => {
  try {
    const { text, profileId } = req.body as { text?: string; profileId?: string }

    if (!text || !profileId) {
      return res.status(400).json({
        error: "Se requieren text y profileId",
        example: { text: "contenido a procesar", profileId: "1" },
      })
    }

    const job = createProcessJob({ filePath: "", profileId })

    try {
      await sendTextToN8N(job, text)
    } catch (error) {
      console.error("[PROCESS TEXT] Error enviando a n8n:", error)
    }

    console.log(`[PROCESS TEXT] Job ${job.id} creado para texto -> perfil ${profileId}`)

    return res.json({
      success: true,
      jobId: job.id,
      status: "pending",
      message: "Texto enviado a procesamiento",
      checkStatus: `GET /api/process/status?jobId=${job.id}`,
    })
  } catch (error) {
    console.error("[PROCESS TEXT ERROR]", error)
    return res.status(500).json({ error: "Error al iniciar procesamiento de texto" })
  }
})

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

async function sendTextToN8N(job: ProcessJob, text: string) {
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

async function sendFileToN8N(job: ProcessJob, filename: string) {
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

export { router as processRouter }
