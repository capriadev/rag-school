import { embedTexts } from "../embeddings"
import { generateAnswer } from "../llm"
import { matchDocuments } from "../supabase"
import { CHUNK_OPTIONS, DEFAULT_CHUNK_COUNT } from "../../shared/llm"
import type { MatchDocument } from "../../shared/types"

export type QueryInput = {
  question: string
  profileId: number
  chunkCount: number
  context: Array<{ role: "user" | "assistant"; content: string }>
}

export function resolveChunkCount(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return DEFAULT_CHUNK_COUNT
  return CHUNK_OPTIONS.includes(parsed) ? parsed : DEFAULT_CHUNK_COUNT
}

function normalizeChunkContent(content: string): string {
  return content.replace(/\s+/g, " ").trim()
}

function dedupeMatches(matches: MatchDocument[]): MatchDocument[] {
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

export async function runQuery(input: QueryInput): Promise<{ answer: string; matches: MatchDocument[] }> {
  const [embedding] = await embedTexts([input.question], "RETRIEVAL_QUERY")

  if (!embedding?.length) {
    throw new Error("No se pudo generar el embedding de la consulta.")
  }

  const rawMatches = await matchDocuments({
    embedding,
    profileId: input.profileId,
    matchCount: input.chunkCount,
    filter: {},
  })

  const matches = dedupeMatches(rawMatches).slice(0, input.chunkCount)
  const contexts = matches.map((match, index) => {
    const similarity = typeof match.similarity === "number" ? ` (similitud ${(match.similarity * 100).toFixed(1)}%)` : ""
    return `[Fragmento ${index + 1}${similarity}]\n${match.content}`
  })

  const answer = await generateAnswer({
    question: input.question,
    contexts,
    chunkCount: input.chunkCount,
    context: input.context,
  })

  return { answer, matches }
}
