import path from "node:path"

export const TRAIN_ROOT_DIR = process.cwd()
export const TRAIN_ADMIN_HTML_PATH = path.join(TRAIN_ROOT_DIR, "admin.html")
export const TRAIN_UPLOADS_DIR = path.join(TRAIN_ROOT_DIR, "uploads")

export const TRAIN_PORT = Number(process.env.TRAIN_PORT || 3001)

export function getTrainWebhookUrl(): string {
  return process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/train"
}
