import { createClient } from "@supabase/supabase-js"
import { config } from "./config"

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

function toPgVector(values) {
  return `[${values.join(",")}]`
}

export async function insertDocuments(documents) {
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

export async function matchDocuments({ embedding, matchCount, filter = {} }) {
  const { data, error } = await supabase.rpc(config.matchFunction, {
    query_embedding: toPgVector(embedding),
    match_count: matchCount,
    filter,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}
