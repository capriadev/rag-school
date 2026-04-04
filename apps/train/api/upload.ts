import { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs/promises"
import { existsSync } from "fs"

const router = Router()

// Asegurar que existe el directorio de uploads
const UPLOAD_DIR = path.join(process.cwd(), "uploads")
if (!existsSync(UPLOAD_DIR)) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    // Aceptar PDFs, textos, imágenes, videos, audios, office
    const allowedMimes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "image/",
      "video/",
      "audio/",
      "application/vnd.openxmlformats",
      "application/vnd.ms",
      "application/msword",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
    ]
    
    const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime) || file.mimetype === mime)
    
    if (isAllowed) {
      cb(null, true)
    } else {
      cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}`))
    }
  },
})

// POST /api/upload - Subir archivo para entrenamiento
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo" })
    }

    const { profileId } = req.body
    if (!profileId) {
      // Eliminar archivo si no hay profileId
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

    res.json({
      success: true,
      file: fileInfo,
      nextStep: "Envía a /api/process para procesar con n8n",
    })
  } catch (error) {
    console.error("[UPLOAD ERROR]", error)
    res.status(500).json({ error: "Error al procesar la subida" })
  }
})

// GET /api/upload/list - Listar archivos subidos pendientes
router.get("/list", async (req, res) => {
  try {
    const files = await fs.readdir(UPLOAD_DIR)
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const stat = await fs.stat(path.join(UPLOAD_DIR, filename))
        return {
          filename,
          size: stat.size,
          createdAt: stat.birthtime,
        }
      })
    )
    
    res.json({
      count: fileList.length,
      files: fileList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    })
  } catch (error) {
    res.status(500).json({ error: "Error al listar archivos" })
  }
})

export { router as uploadRouter }
