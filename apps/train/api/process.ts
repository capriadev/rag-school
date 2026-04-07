import { Router } from "express"
import path from "node:path"
import fs from "node:fs/promises"
import { TRAIN_UPLOADS_DIR } from "../lib/config.js"
import { createProcessJob, getProcessJob, listProcessJobs } from "../lib/process-jobs.js"
import { sendFileToN8N, sendTextToN8N } from "../services/process-service.js"
import { asNonEmptyString } from "../lib/validation.js"

const router = Router()


router.post("/", async (req, res) => {
  try {
    const body = req.body as { fileId?: string; profileId?: string }
    const fileId = asNonEmptyString(body.fileId)
    const profileId = asNonEmptyString(body.profileId)

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
    const body = req.body as { text?: string; profileId?: string }
    const text = asNonEmptyString(body.text)
    const profileId = asNonEmptyString(body.profileId)

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

export { router as processRouter }
