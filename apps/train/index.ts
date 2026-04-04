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

import { uploadRouter } from "./api/upload.js"
import { processRouter } from "./api/process.js"
import { profilesRouter } from "./api/profiles.js"

const app = express()
const PORT = process.env.TRAIN_PORT || 3001

// Runtime local rooted at apps/train
const TRAIN_DIR = process.cwd()
const ADMIN_HTML_PATH = path.join(TRAIN_DIR, "admin.html")

// Middleware
app.use(cors())
app.use(express.json())

// Serve admin UI
app.get("/", (req, res) => {
  res.sendFile(ADMIN_HTML_PATH)
})

// Rutas API
app.use("/api/upload", uploadRouter)
app.use("/api/process", processRouter)
app.use("/api/profiles", profilesRouter)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", mode: "training-backend", timestamp: new Date().toISOString() })
})

// Estado del sistema
app.get("/api/status", (req, res) => {
  res.json({
    status: "ready",
    n8nWebhook: process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/train",
    uploadPath: path.join(process.cwd(), "uploads"),
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  RAG Custom - Training Backend                     ║
║  Modo: LOCAL ONLY (no deployar a Vercel)           ║
╠════════════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                        ║
║  Health: http://localhost:${PORT}/health              ║
╚════════════════════════════════════════════════════╝
  `)
})

export { app }
