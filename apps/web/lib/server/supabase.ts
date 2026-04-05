import { getSupabaseClient as getSharedSupabaseClient } from "@rag/data"
import { config } from "./config"
import type { MatchDocument } from "../shared/types"
const supabase = getSharedSupabaseClient()

function toPgVector(values: number[]): string {
  return `[${values.join(",")}]`
}

export async function matchDocuments({
  embedding,
  profileId,
  matchCount,
  filter = {},
}: {
  embedding: number[]
  profileId: number
  matchCount: number
  filter?: Record<string, unknown>
}): Promise<MatchDocument[]> {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: toPgVector(embedding),
    profile_id: profileId,
    match_count: matchCount,
    filter,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function pingVectorStore(): Promise<{ reachable: boolean; rowsChecked: number }> {
  const { data, error } = await supabase.from(config.documentsTable).select("id_doc").limit(1)

  if (error) {
    throw new Error(error.message)
  }

  return {
    reachable: true,
    rowsChecked: data?.length || 0,
  }
}
