import { createClient } from "@supabase/supabase-js"
import { config } from "./config"
import { GEMINI_EMBEDDING_DIMENSION } from "./embeddings"
import type { InsertDocument, MatchDocument, VectorDocumentRow, VectorStoreMetrics } from "../shared/types"

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

function toPgVector(values: number[]): string {
  return `[${values.join(",")}]`
}

function estimateRowBytes(row: VectorDocumentRow): number {
  const contentBytes = Buffer.byteLength(row.content || "", "utf8")
  const metadataBytes = Buffer.byteLength(JSON.stringify(row.metadata || {}), "utf8")
  const embeddingBytes = GEMINI_EMBEDDING_DIMENSION * 4

  return contentBytes + metadataBytes + embeddingBytes
}

async function listDocuments(includeEmbedding: boolean): Promise<VectorDocumentRow[]> {
  const rows: VectorDocumentRow[] = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const selectClause = includeEmbedding ? "id, content, metadata, embedding" : "id, content, metadata"
    const { data, error } = await supabase
      .from(config.documentsTable)
      .select(selectClause)
      .range(from, from + pageSize - 1)

    if (error) {
      throw new Error(error.message)
    }

    const page = ((data || []) as unknown) as VectorDocumentRow[]
    rows.push(...page)

    if (page.length < pageSize) {
      break
    }

    from += pageSize
  }

  return rows
}

export async function insertDocuments(documents: InsertDocument[]): Promise<{ inserted: number }> {
  if (!documents.length) return { inserted: 0 }

  const payload = documents.map((document) => ({
    content: document.content,
    metadata: document.metadata,
    embedding: toPgVector(document.embedding),
  }))

  const { error } = await supabase.from(config.documentsTable).insert(payload)

  if (error) {
    throw new Error(error.message)
  }

  return { inserted: payload.length }
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

export async function getVectorStoreMetrics(): Promise<VectorStoreMetrics> {
  const rows = await listDocuments(false)
  const uniqueSources = new Set<string>()
  const sourceTypes: Record<string, number> = {}
  let estimatedStorageBytes = 0

  for (const row of rows) {
    estimatedStorageBytes += estimateRowBytes(row)

    const sourceName = typeof row.metadata?.sourceName === "string" ? row.metadata.sourceName : ""
    const sourceType = typeof row.metadata?.sourceType === "string" ? row.metadata.sourceType : "unknown"

    if (sourceName) {
      uniqueSources.add(sourceName)
    }

    sourceTypes[sourceType] = (sourceTypes[sourceType] || 0) + 1
  }

  return {
    estimatedStorageBytes,
    totalChunks: rows.length,
    uniqueSources: uniqueSources.size,
    sourceTypes,
  }
}

export async function exportVectorStoreSnapshot(): Promise<VectorDocumentRow[]> {
  return listDocuments(true)
}

export async function getProfiles(): Promise<Array<{ id_profile: number; name: string; description: string | null; active: boolean }>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id_profile, name, description, active")
    .order("name")

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function pingVectorStore(): Promise<{ reachable: boolean; rowsChecked: number }> {
  const { data, error } = await supabase.from("documents").select("id_doc").limit(1)

  if (error) {
    throw new Error(error.message)
  }

  return {
    reachable: true,
    rowsChecked: data?.length || 0,
  }
}
