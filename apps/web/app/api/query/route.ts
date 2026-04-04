import { NextResponse } from "next/server"
import { embedTexts } from "../../../lib/server/embeddings"
import { CHUNK_OPTIONS, DEFAULT_CHUNK_COUNT } from "../../../lib/shared/llm"
import { generateAnswer } from "../../../lib/server/llm"
import { matchDocuments } from "../../../lib/server/supabase"
import type { MatchDocument } from "../../../lib/shared/types"

export const runtime = "nodejs"

function resolveChunkCount(value: unknown) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    return DEFAULT_CHUNK_COUNT
  }

  return CHUNK_OPTIONS.includes(parsed) ? parsed : DEFAULT_CHUNK_COUNT
}

function normalizeChunkContent(content: string) {
  return content.replace(/\s+/g, " ").trim()
}

function dedupeMatches(matches: MatchDocument[]) {
  const seen = new Set<string>()

  return matches.filter((match) => {
    const normalizedContent = normalizeChunkContent(match.content)
    const key = `content:${normalizedContent}`

    if (!normalizedContent || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: unknown
      chunkCount?: unknown
      profileId?: unknown
      context?: Array<{ role: "user" | "assistant"; content: string }>
    }
    const question = String(body.question || "").trim()
    const chunkCount = resolveChunkCount(body.chunkCount)
    const profileId = Number(body.profileId)
    const context = body.context || []

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: "La pregunta es obligatoria.",
        },
        { status: 400 },
      )
    }

    if (!profileId || !Number.isInteger(profileId) || profileId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "El ID del perfil es obligatorio.",
        },
        { status: 400 },
      )
    }

    const [embedding] = await embedTexts([question], "RETRIEVAL_QUERY")

    if (!embedding?.length) {
      throw new Error("No se pudo generar el embedding de la consulta.")
    }

    const rawMatches = await matchDocuments({
      embedding,
      profileId,
      matchCount: chunkCount,
      filter: {},
    })
    const matches = dedupeMatches(rawMatches).slice(0, chunkCount)

    const contexts = matches.map((match: MatchDocument, index: number) => {
      const similarity =
        typeof match.similarity === "number"
          ? ` (similitud ${(match.similarity * 100).toFixed(1)}%)`
          : ""

      return `[Fragmento ${index + 1}${similarity}]\n${match.content}`
    })

    const answer = await generateAnswer({ question, contexts, chunkCount, context })

    return NextResponse.json({
      success: true,
      answer,
      chunkCount,
      matches,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query failed"

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
