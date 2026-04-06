import { NextResponse } from "next/server"
import { listActiveProfiles } from "@rag/core"
import type { ProfilesListResponse } from "@rag/contracts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET() {
  try {
    const profiles = await listActiveProfiles()
    const payload: ProfilesListResponse = {
      success: true,
      profiles,
    }

    return NextResponse.json(
      payload,
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profiles"
    const payload: ProfilesListResponse = {
      success: false,
      error: message,
    }

    return NextResponse.json(
      payload,
      { status: 500 },
    )
  }
}
