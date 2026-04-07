import { Router } from "express"
import multer from "multer"
import path from "node:path"
import fs from "node:fs/promises"
import { TRAIN_UPLOADS_DIR } from "../lib/config.js"
import { ensureUploadsDirectory, isAllowedUploadMime } from "../lib/uploads.js"
import { asNonEmptyString } from "../lib/validation.js"

const router = Router()

await ensureUploadsDirectory()

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, TRAIN_UPLOADS_DIR)
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    callback(null, `${uniqueSuffix}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (isAllowedUploadMime(file.mimetype)) {
      callback(null, true)
      return
    }

    callback(new Error(`Tipo de archivo no soportado: ${file.mimetype}`))
  },
})

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subio ningun archivo" })
    }

    const { profileId: rawProfileId } = req.body as { profileId?: string }
    const profileId = asNonEmptyString(rawProfileId)
    if (!profileId) {
      await fs.unlink(req.file.path)
      return res.status(400).json({ error: "Se requiere profileId" })
    }

    const fileInfo = {
      id: path.basename(req.file.filename, path.extname(req.file.filename)),
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      profileId,
      uploadedAt: new Date().toISOString(),
    }

    console.log(`[UPLOAD] Archivo recibido: ${fileInfo.originalName} (${fileInfo.size} bytes) para perfil ${profileId}`)

    return res.json({
      success: true,
      file: fileInfo,
      nextStep: "Envia a /api/process para procesar con n8n",
    })
  } catch (error) {
    console.error("[UPLOAD ERROR]", error)
    return res.status(500).json({ error: "Error al procesar la subida" })
  }
})

router.get("/list", async (req, res) => {
  try {
    const files = await fs.readdir(TRAIN_UPLOADS_DIR)

    const fileList = await Promise.all(
      files.map(async (filename) => {
        const fullPath = path.join(TRAIN_UPLOADS_DIR, filename)
        const stat = await fs.stat(fullPath)

        return {
          filename,
          size: stat.size,
          createdAt: stat.birthtime,
        }
      }),
    )

    return res.json({
      count: fileList.length,
      files: fileList.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
    })
  } catch {
    return res.status(500).json({ error: "Error al listar archivos" })
  }
})

export { router as uploadRouter }
