#!/usr/bin/env tsx
/**
 * RAG Custom - Training Backend
 * 
 * Servidor local para entrenamiento de RAG.
 * NO se deploya a Vercel - solo ejecutar localmente con `npm run train`
 */

import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"

import { uploadRouter } from "./api/upload.js"
import { processRouter } from "./api/process.js"

const app = express()
const PORT = process.env.TRAIN_PORT || 3001
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(cors())
app.use(express.json())

// Serve admin UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"))
})

// Rutas API
app.use("/api/upload", uploadRouter)
app.use("/api/process", processRouter)

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
