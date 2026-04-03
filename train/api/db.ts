/**
 * Database integration for Training Backend
 * Uses existing Supabase configuration from lib/server/
 */

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import path from "path"

// Load env from root
dotenv.config({ path: path.join(process.cwd(), ".env") })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

// Types
export interface Profile {
  id_profile: number
  name: string
  description: string | null
  active: boolean
  doc_count: number
  f_created: string
}

export interface CreateProfileInput {
  name: string
  description?: string
}

export interface InsertDocumentInput {
  id_profile: number
  content: string
  metadata: Record<string, unknown>
  embedding: number[]
}

function toPgVector(values: number[]): string {
  return `[${values.join(",")}]`
}

/**
 * Create a new profile
 */
export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      name: input.name,
      description: input.description || null,
      active: true,
      doc_count: 0,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error(`Ya existe un perfil con el nombre: ${input.name}`)
    }
    throw new Error(`Error creando perfil: ${error.message}`)
  }

  return data as Profile
}

/**
 * Get all active profiles
 */
export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id_profile, name, description, active, doc_count, f_created")
    .eq("active", true)
    .order("name")

  if (error) {
    throw new Error(`Error cargando perfiles: ${error.message}`)
  }

  return (data || []) as Profile[]
}

/**
 * Get profile by ID
 */
export async function getProfileById(id: number): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id_profile", id)
    .eq("active", true)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(`Error buscando perfil: ${error.message}`)
  }

  return data as Profile
}

/**
 * Insert documents with embeddings
 */
export async function insertDocuments(documents: InsertDocumentInput[]): Promise<{ inserted: number }> {
  if (!documents.length) return { inserted: 0 }

  const payload = documents.map((doc) => ({
    id_profile: doc.id_profile,
    content: doc.content,
    metadata: doc.metadata,
    embedding: toPgVector(doc.embedding),
  }))

  const { error } = await supabase.from("documents").insert(payload)

  if (error) {
    throw new Error(`Error insertando documentos: ${error.message}`)
  }

  return { inserted: payload.length }
}

/**
 * Delete profile and all its documents (cascade)
 */
export async function deleteProfile(id: number): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id_profile", id)

  if (error) {
    throw new Error(`Error eliminando perfil: ${error.message}`)
  }
}

/**
 * Update profile
 */
export async function updateProfile(
  id: number,
  updates: Partial<Pick<Profile, "name" | "description" | "active">>
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id_profile", id)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Error actualizando perfil: ${error.message}`)
  }

  return data as Profile
}

/**
 * Get document count for a profile
 */
export async function getProfileDocCount(profileId: number): Promise<number> {
  const { count, error } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("id_profile", profileId)

  if (error) {
    throw new Error(`Error contando documentos: ${error.message}`)
  }

  return count || 0
}

export { supabase }
