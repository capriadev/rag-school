#!/usr/bin/env tsx
/**
 * RAG Custom - Training Backend
 *
 * Servidor local para entrenamiento de RAG.
 * No se deploya a Vercel: ejecutar localmente con `npm run train`.
 */

import express from "express"
import cors from "cors"

import { uploadRouter } from "./api/upload.js"
import { processRouter } from "./api/process.js"
import { profilesRouter } from "./api/profiles.js"
import { systemRouter } from "./api/system.js"
import { TRAIN_ADMIN_HTML_PATH, TRAIN_PORT } from "./lib/config.js"

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.sendFile(TRAIN_ADMIN_HTML_PATH)
})

app.use("/api/upload", uploadRouter)
app.use("/api/process", processRouter)
app.use("/api/profiles", profilesRouter)
app.use(systemRouter)

app.listen(TRAIN_PORT, () => {
  console.log(`[TRAIN] RAG Custom training backend escuchando en http://localhost:${TRAIN_PORT}`)
})

export { app }
