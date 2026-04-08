import { NextResponse } from "next/server"
import type { QueryResponseDto } from "@rag/contracts"
import { resolveChunkCount, runQuery } from "../../../lib/server/services/query-service"

export const runtime = "nodejs"

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
      const payload: QueryResponseDto = {
        success: false,
        error: "La pregunta es obligatoria.",
      }
      return NextResponse.json(payload, { status: 400 })
    }

    if (!profileId || !Number.isInteger(profileId) || profileId <= 0) {
      const payload: QueryResponseDto = {
        success: false,
        error: "El ID del perfil es obligatorio.",
      }
      return NextResponse.json(payload, { status: 400 })
    }

    const { answer, matches } = await runQuery({
      question,
      profileId,
      chunkCount,
      context,
    })

    return NextResponse.json({
      success: true,
      answer,
      chunkCount,
      matches,
    })
  } catch (error) {
    const payload: QueryResponseDto = {
      success: false,
      error: error instanceof Error ? error.message : "Query failed",
    }

    return NextResponse.json(payload, { status: 500 })
  }
}
