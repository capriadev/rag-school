import { Router } from "express"
import path from "path"
import fs from "fs/promises"
import { insertDocuments } from "./db.js"

const router = Router()

// Job tracking simple (en memoria - se pierde al reiniciar)
const jobs = new Map<string, {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  filePath: string
  profileId: string
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
}>()

// POST /api/process - Enviar archivo a n8n para procesamiento
router.post("/", async (req, res) => {
  try {
    const { fileId, profileId } = req.body

    if (!fileId || !profileId) {
      return res.status(400).json({ 
        error: "Se requieren fileId y profileId",
        example: { fileId: "123456789-nombre.pdf", profileId: "1" }
      })
    }

    // Buscar archivo
    const UPLOAD_DIR = path.join(process.cwd(), "train", "uploads")
    const files = await fs.readdir(UPLOAD_DIR)
    const matchingFile = files.find(f => f.includes(fileId))

    if (!matchingFile) {
      return res.status(404).json({ error: `Archivo no encontrado: ${fileId}` })
    }

    const filePath = path.join(UPLOAD_DIR, matchingFile)
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Crear job
    const job = {
      id: jobId,
      status: "pending" as const,
      filePath,
      profileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    jobs.set(jobId, job)

    // Enviar a n8n webhook (async - no esperamos respuesta)
    sendToN8N(job, matchingFile)

    console.log(`[PROCESS] Job ${jobId} creado para ${matchingFile} -> perfil ${profileId}`)

    res.json({
      success: true,
      jobId,
      status: "pending",
      message: "Archivo enviado a procesamiento",
      checkStatus: `GET /api/process/status?jobId=${jobId}`,
    })
  } catch (error) {
    console.error("[PROCESS ERROR]", error)
    res.status(500).json({ error: "Error al iniciar procesamiento" })
  }
})

// GET /api/process/status - Ver estado de un job
router.get("/status", (req, res) => {
  const { jobId } = req.query
  
  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Se requiere jobId" })
  }

  const job = jobs.get(jobId)
  if (!job) {
    return res.status(404).json({ error: "Job no encontrado" })
  }

  res.json({
    id: job.id,
    status: job.status,
    profileId: job.profileId,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  })
})

// GET /api/process/jobs - Listar todos los jobs
router.get("/jobs", (req, res) => {
  const allJobs = Array.from(jobs.values())
  res.json({
    count: allJobs.length,
    jobs: allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  })
})

// Función para enviar a n8n webhook y guardar en DB
async function sendToN8N(job: any, filename: string) {
  const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/train"
  
  try {
    job.status = "processing"
    job.updatedAt = new Date().toISOString()

    const formData = new FormData()
    
    // Leer archivo y crear blob
    const fileBuffer = await fs.readFile(job.filePath)
    const blob = new Blob([fileBuffer])
    formData.append("file", blob, filename)
    formData.append("profileId", job.profileId)
    formData.append("jobId", job.id)
    formData.append("webhookResponse", "true") // Para que n8n responda sync

    console.log(`[N8N] Enviando ${filename} a ${N8N_WEBHOOK}`)

    const response = await fetch(N8N_WEBHOOK, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`n8n respondió ${response.status}: ${await response.text()}`)
    }

    const result = await response.json()
    
    // n8n debe devolver: { chunks: [{ content, metadata, embedding }] }
    if (result.chunks && Array.isArray(result.chunks) && result.chunks.length > 0) {
      console.log(`[DB] Insertando ${result.chunks.length} chunks en Supabase...`)
      
      const documents = result.chunks.map((chunk: any) => ({
        id_profile: parseInt(job.profileId),
        content: chunk.content || chunk.text || "",
        metadata: chunk.metadata || { source: filename },
        embedding: chunk.embedding || [],
      }))

      const { inserted } = await insertDocuments(documents)
      
      job.status = "completed"
      job.result = { 
        ...result, 
        inserted,
        message: `${inserted} documentos insertados en el perfil ${job.profileId}`
      }
      job.updatedAt = new Date().toISOString()

      console.log(`[DB] Job ${job.id} completado: ${inserted} documentos insertados`)
    } else {
      // n8n no devolvió chunks - solo marcamos como completado
      job.status = "completed"
      job.result = result
      job.updatedAt = new Date().toISOString()
      
      console.log(`[N8N] Job ${job.id} completado (sin chunks para insertar):`, result)
    }

    // Opcional: eliminar archivo después de procesar exitosamente
    // await fs.unlink(job.filePath)

  } catch (error: any) {
    console.error(`[PROCESS ERROR] Job ${job.id}:`, error)
    job.status = "failed"
    job.error = error.message
    job.updatedAt = new Date().toISOString()
  }
}

export { router as processRouter }
