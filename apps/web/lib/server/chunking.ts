import type { ChunkOptions } from "../shared/types"

export function chunkText(text: string, options: ChunkOptions = {}) {
  const chunkSize = options.chunkSize ?? 1400
  const chunkOverlap = options.chunkOverlap ?? 200
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim()

  if (!normalized) return []

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ""

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph

    if (candidate.length <= chunkSize) {
      current = candidate
      continue
    }

    if (current) {
      chunks.push(current.trim())
      current = current.slice(Math.max(0, current.length - chunkOverlap))
    }

    if (paragraph.length <= chunkSize) {
      current = current ? `${current}\n\n${paragraph}` : paragraph
      continue
    }

    let start = 0

    while (start < paragraph.length) {
      const end = Math.min(start + chunkSize, paragraph.length)
      const piece = paragraph.slice(start, end).trim()

      if (piece) chunks.push(piece)
      if (end >= paragraph.length) break

      start = Math.max(end - chunkOverlap, start + 1)
    }

    current = ""
  }

  if (current.trim()) chunks.push(current.trim())

  return chunks
}
