import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import { TRAIN_UPLOADS_DIR } from "./config.js"

const ALLOWED_MIME_PREFIXES = [
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

export async function ensureUploadsDirectory(): Promise<void> {
  if (!existsSync(TRAIN_UPLOADS_DIR)) {
    await fs.mkdir(TRAIN_UPLOADS_DIR, { recursive: true })
  }
}

export function isAllowedUploadMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix) || mime === prefix)
}
