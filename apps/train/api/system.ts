import { Router } from "express"
import { TRAIN_UPLOADS_DIR, getTrainWebhookUrl } from "../lib/config.js"

const router = Router()

router.get("/health", (req, res) => {
  res.json({ status: "ok", mode: "training-backend", timestamp: new Date().toISOString() })
})

router.get("/api/status", (req, res) => {
  res.json({
    status: "ready",
    n8nWebhook: getTrainWebhookUrl(),
    uploadPath: TRAIN_UPLOADS_DIR,
  })
})

export { router as systemRouter }
