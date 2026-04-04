import { getSupabaseClient } from "@rag/data"

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

type ProfileUpdates = Partial<Pick<Profile, "name" | "description" | "active">>

export async function listActiveProfiles(): Promise<Array<Pick<Profile, "id_profile" | "name" | "description" | "active">>> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select("id_profile, name, description, active")
    .eq("active", true)
    .order("name")

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function listAllProfiles(): Promise<Profile[]> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select("id_profile, name, description, active, doc_count, f_created")
    .order("name")

  if (error) {
    throw new Error(`Error cargando perfiles: ${error.message}`)
  }

  return (data || []) as Profile[]
}

export async function getProfileById(id: number): Promise<Profile | null> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select("id_profile, name, description, active, doc_count, f_created")
    .eq("id_profile", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(`Error buscando perfil: ${error.message}`)
  }

  return data as Profile
}

export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .insert({
      name: input.name,
      description: input.description || null,
      active: true,
      doc_count: 0,
    } as never)
    .select("id_profile, name, description, active, doc_count, f_created")
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error(`Ya existe un perfil con el nombre: ${input.name}`)
    }
    throw new Error(`Error creando perfil: ${error.message}`)
  }

  return data as Profile
}

export async function updateProfileById(id: number, updates: ProfileUpdates): Promise<Profile> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .update(updates as never)
    .eq("id_profile", id)
    .select("id_profile, name, description, active, doc_count, f_created")
    .single()

  if (error) {
    throw new Error(`Error actualizando perfil: ${error.message}`)
  }

  return data as Profile
}

export async function deleteProfileById(id: number): Promise<void> {
  const { error } = await getSupabaseClient().from("profiles").delete().eq("id_profile", id)

  if (error) {
    throw new Error(`Error eliminando perfil: ${error.message}`)
  }
}

export async function countProfileDocuments(profileId: number): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("id_profile", profileId)

  if (error) {
    throw new Error(`Error contando documentos: ${error.message}`)
  }

  return count || 0
}
