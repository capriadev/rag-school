import { Router } from "express"
import {
  createProfile,
  getProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
  getProfileDocCount,
} from "./db.js"
import { asNonEmptyString, asPositiveInt } from "../lib/validation.js"

const router = Router()

router.get("/", async (req, res) => {
  try {
    const profiles = await getProfiles()
    return res.json({
      success: true,
      profiles: profiles.map((profile) => ({
        id_profile: profile.id_profile,
        name: profile.name,
        description: profile.description,
        active: profile.active,
        doc_count: profile.doc_count,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno"
    console.error("[PROFILES LIST ERROR]", error)
    return res.status(500).json({ error: message })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const id = asPositiveInt(req.params.id)
    if (id === null) {
      return res.status(400).json({ error: "ID invalido" })
    }

    const [profile, docCount] = await Promise.all([getProfileById(id), getProfileDocCount(id)])

    if (!profile) {
      return res.status(404).json({ error: "Perfil no encontrado" })
    }

    return res.json({
      success: true,
      profile: {
        ...profile,
        doc_count: docCount,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno"
    console.error("[PROFILE GET ERROR]", error)
    return res.status(500).json({ error: message })
  }
})

router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body as { name?: string; description?: string }

    const parsedName = asNonEmptyString(name)
    if (!parsedName) {
      return res.status(400).json({ error: "El nombre es requerido" })
    }

    const profile = await createProfile({
      name: parsedName,
      description: description?.trim(),
    })

    console.log(`[PROFILE CREATED] ${profile.name} (ID: ${profile.id_profile})`)

    return res.status(201).json({
      success: true,
      profile: {
        id_profile: profile.id_profile,
        name: profile.name,
        description: profile.description,
        active: profile.active,
        doc_count: 0,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno"
    console.error("[PROFILE CREATE ERROR]", error)
    return res.status(500).json({ error: message })
  }
})

router.patch("/:id", async (req, res) => {
  try {
    const id = asPositiveInt(req.params.id)
    if (id === null) {
      return res.status(400).json({ error: "ID invalido" })
    }

    const { name, description, active } = req.body as {
      name?: string
      description?: string | null
      active?: boolean
    }

    const updates: { name?: string; description?: string | null; active?: boolean } = {}

    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (active !== undefined) updates.active = active

    const profile = await updateProfile(id, updates)

    console.log(`[PROFILE UPDATED] ${profile.name} (ID: ${profile.id_profile})`)

    return res.json({
      success: true,
      profile: {
        id_profile: profile.id_profile,
        name: profile.name,
        description: profile.description,
        active: profile.active,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno"
    console.error("[PROFILE UPDATE ERROR]", error)
    return res.status(500).json({ error: message })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const id = asPositiveInt(req.params.id)
    if (id === null) {
      return res.status(400).json({ error: "ID invalido" })
    }

    await deleteProfile(id)
    console.log(`[PROFILE DELETED] ID: ${id}`)

    return res.json({
      success: true,
      message: "Perfil eliminado correctamente",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno"
    console.error("[PROFILE DELETE ERROR]", error)
    return res.status(500).json({ error: message })
  }
})

export { router as profilesRouter }
