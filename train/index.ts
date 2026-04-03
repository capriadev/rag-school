#!/usr/bin/env tsx
/**
 * RAG Custom - Training Backend
 * 
 * Servidor local para entrenamiento de RAG.
 * NO se deploya a Vercel - solo ejecutar localmente con `npm run train`
 */

import express from "express"
import cors from "cors"
import multer from "multer"
import path from "path"

const app = express()
const PORT = process.env.TRAIN_PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Configuración de multer para subida de archivos
const upload = multer({
  dest: path.join(process.cwd(), "train", "uploads"),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
})

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", mode: "training-backend", timestamp: new Date().toISOString() })
})

// Estado del sistema
app.get("/api/status", (req, res) => {
  res.json({
    status: "ready",
    n8nWebhook: process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/entrenar",
    uploadPath: path.join(process.cwd(), "train", "uploads"),
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  RAG Custom - Training Backend                               ║
║  Modo: LOCAL ONLY (no deployar a Vercel)                     ║
╠══════════════════════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                                ║
║  Health: http://localhost:${PORT}/health                      ║
╚══════════════════════════════════════════════════════════════╝
  `)
})

export { app }
