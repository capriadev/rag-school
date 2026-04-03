import { Router } from "express"
import { 
  createProfile, 
  getProfiles, 
  getProfileById, 
  updateProfile, 
  deleteProfile,
  getProfileDocCount 
} from "./db.js"

const router = Router()

/**
 * GET /api/profiles - List all profiles
 */
router.get("/", async (req, res) => {
  try {
    const profiles = await getProfiles()
    res.json({
      success: true,
      profiles: profiles.map(p => ({
        id_profile: p.id_profile,
        name: p.name,
        description: p.description,
        doc_count: p.doc_count,
      })),
    })
  } catch (error: any) {
    console.error("[PROFILES LIST ERROR]", error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/profiles/:id - Get single profile
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    const [profile, docCount] = await Promise.all([
      getProfileById(id),
      getProfileDocCount(id),
    ])

    if (!profile) {
      return res.status(404).json({ error: "Perfil no encontrado" })
    }

    res.json({
      success: true,
      profile: {
        ...profile,
        doc_count: docCount,
      },
    })
  } catch (error: any) {
    console.error("[PROFILE GET ERROR]", error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/profiles - Create new profile
 */
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "El nombre es requerido" })
    }

    const profile = await createProfile({
      name: name.trim(),
      description: description?.trim(),
    })

    console.log(`[PROFILE CREATED] ${profile.name} (ID: ${profile.id_profile})`)

    res.status(201).json({
      success: true,
      profile: {
        id_profile: profile.id_profile,
        name: profile.name,
        description: profile.description,
        doc_count: 0,
      },
    })
  } catch (error: any) {
    console.error("[PROFILE CREATE ERROR]", error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PATCH /api/profiles/:id - Update profile
 */
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    const { name, description, active } = req.body
    const updates: any = {}

    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim()
    if (active !== undefined) updates.active = active

    const profile = await updateProfile(id, updates)

    console.log(`[PROFILE UPDATED] ${profile.name} (ID: ${profile.id_profile})`)

    res.json({
      success: true,
      profile: {
        id_profile: profile.id_profile,
        name: profile.name,
        description: profile.description,
        active: profile.active,
      },
    })
  } catch (error: any) {
    console.error("[PROFILE UPDATE ERROR]", error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/profiles/:id - Delete profile
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    await deleteProfile(id)

    console.log(`[PROFILE DELETED] ID: ${id}`)

    res.json({
      success: true,
      message: "Perfil eliminado correctamente",
    })
  } catch (error: any) {
    console.error("[PROFILE DELETE ERROR]", error)
    res.status(500).json({ error: error.message })
  }
})

export { router as profilesRouter }
