import path from "node:path"
import fs from "node:fs/promises"
import type { Request, Response } from "express"
import { TRAIN_UPLOADS_DIR } from "../lib/config.js"
import { createProcessJob, getProcessJob, listProcessJobs } from "../lib/process-jobs.js"
import { asNonEmptyString } from "../lib/validation.js"
import { sendFileToN8N, sendTextToN8N } from "../services/process-service.js"
import { badRequest, internalError, notFound } from "../lib/http.js"

export async function startFileProcessHandler(req: Request, res: Response) {
  try {
    const body = req.body as { fileId?: string; profileId?: string }
    const fileId = asNonEmptyString(body.fileId)
    const profileId = asNonEmptyString(body.profileId)

    if (!fileId || !profileId) {
      return badRequest(res, "Se requieren fileId y profileId", {
        example: { fileId: "123456789-nombre.pdf", profileId: "1" },
      })
    }

    const files = await fs.readdir(TRAIN_UPLOADS_DIR)
    const matchingFile = files.find((file) => file.includes(fileId))

    if (!matchingFile) {
      return notFound(res, `Archivo no encontrado: ${fileId}`)
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
    return internalError(res, error, "Error al iniciar procesamiento")
  }
}

export function getProcessStatusHandler(req: Request, res: Response) {
  const { jobId } = req.query

  if (!jobId || typeof jobId !== "string") {
    return badRequest(res, "Se requiere jobId")
  }

  const job = getProcessJob(jobId)
  if (!job) {
    return notFound(res, "Job no encontrado")
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
}

export function listProcessJobsHandler(req: Request, res: Response) {
  const jobs = listProcessJobs().sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })

  return res.json({
    count: jobs.length,
    jobs,
  })
}

export async function startTextProcessHandler(req: Request, res: Response) {
  try {
    const body = req.body as { text?: string; profileId?: string }
    const text = asNonEmptyString(body.text)
    const profileId = asNonEmptyString(body.profileId)

    if (!text || !profileId) {
      return badRequest(res, "Se requieren text y profileId", {
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
    return internalError(res, error, "Error al iniciar procesamiento de texto")
  }
}
