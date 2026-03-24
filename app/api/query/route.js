import { NextResponse } from "next/server"
import { config } from "../../../lib/server/config"
import { embedTexts } from "../../../lib/server/gemini"
import { CHUNK_OPTIONS } from "../../../lib/shared/llm"
import { generateAnswer } from "../../../lib/server/llm"
import { matchDocuments } from "../../../lib/server/supabase"

export const runtime = "nodejs"

function resolveChunkCount(value) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    return 3
  }

  return CHUNK_OPTIONS.includes(parsed) ? parsed : 3
}

export async function POST(request) {
  try {
    const body = await request.json()
    const question = String(body.question || "").trim()
    const chunkCount = resolveChunkCount(body.chunkCount)

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: "La pregunta es obligatoria.",
        },
        { status: 400 },
      )
    }

    const [embedding] = await embedTexts([question], "RETRIEVAL_QUERY")

    if (!embedding?.length) {
      throw new Error("No se pudo generar el embedding de la consulta.")
    }

    const matches = await matchDocuments({
      embedding,
      matchCount: chunkCount,
      filter: {},
    })

    const contexts = matches.map((match, index) => {
      const similarity =
        typeof match.similarity === "number"
          ? ` (similitud ${(match.similarity * 100).toFixed(1)}%)`
          : ""

      return `[Fragmento ${index + 1}${similarity}]\n${match.content}`
    })

    const answer = await generateAnswer({ question, contexts, chunkCount })

    return NextResponse.json({
      success: true,
      answer,
      chunkCount,
      matches,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Query failed",
      },
      { status: 500 },
    )
  }
}
