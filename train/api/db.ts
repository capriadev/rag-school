/**
 * Database integration for Training Backend
 * Reuses shared server modules to avoid train/web drift.
 */

import {
  createProfile as createProfileRecord,
  listAllProfiles,
  getProfileById as getProfileRecordById,
  updateProfileById,
  deleteProfileById,
  countProfileDocuments,
  type Profile,
  type CreateProfileInput,
} from "../../lib/server/profiles.js"
import { getSupabaseClient } from "../../lib/server/supabase.js"

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
  return createProfileRecord(input)
}

/**
 * Get all profiles (active and inactive)
 */
export async function getProfiles(): Promise<Profile[]> {
  return listAllProfiles()
}

/**
 * Get profile by ID
 */
export async function getProfileById(id: number): Promise<Profile | null> {
  return getProfileRecordById(id)
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

  const { error } = await getSupabaseClient().from("documents").insert(payload as never)

  if (error) {
    throw new Error(`Error insertando documentos: ${error.message}`)
  }

  return { inserted: payload.length }
}

/**
 * Delete profile and all its documents (cascade)
 */
export async function deleteProfile(id: number): Promise<void> {
  await deleteProfileById(id)
}

/**
 * Update profile
 */
export async function updateProfile(
  id: number,
  updates: Partial<Pick<Profile, "name" | "description" | "active">>
): Promise<Profile> {
  return updateProfileById(id, updates)
}

/**
 * Get document count for a profile
 */
export async function getProfileDocCount(profileId: number): Promise<number> {
  return countProfileDocuments(profileId)
}
