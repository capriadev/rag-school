import type { Response } from "express"

export function badRequest(res: Response, error: string, extra?: Record<string, unknown>) {
  return res.status(400).json({ error, ...(extra || {}) })
}

export function notFound(res: Response, error: string) {
  return res.status(404).json({ error })
}

export function internalError(res: Response, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback
  return res.status(500).json({ error: message })
}
