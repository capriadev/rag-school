"use client"

import { useCallback, useEffect, useState } from "react"
import type { ProfileDto, ProfilesListResponse } from "@rag/contracts"

export function useProfiles(selectedProfile: string, setSelectedProfile: (value: string) => void) {
  const [profiles, setProfiles] = useState<ProfileDto[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true)
    try {
      const response = await fetch(`/api/profiles?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })
      const data = (await response.json()) as ProfilesListResponse
      if (data.success && Array.isArray(data.profiles)) {
        setProfiles(data.profiles)
        return
      }
      setProfiles([])
    } catch (error) {
      console.error("Failed to load profiles:", error)
      setProfiles([])
    } finally {
      setProfilesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProfile === "chat") return

    const selectedId = Number(selectedProfile)
    if (Number.isNaN(selectedId)) {
      setSelectedProfile("chat")
      return
    }

    const stillExists = profiles.some((p) => p.id_profile === selectedId)
    if (!stillExists) {
      setSelectedProfile("chat")
    }
  }, [profiles, selectedProfile, setSelectedProfile])

  useEffect(() => {
    loadProfiles()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadProfiles()
      }
    }
    const handleFocus = () => {
      loadProfiles()
    }
    const handlePageShow = () => {
      loadProfiles()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("pageshow", handlePageShow)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [loadProfiles])

  return {
    profiles,
    profilesLoading,
    loadProfiles,
  }
}
