import { NextResponse } from "next/server"
import { listActiveProfiles } from "@rag/core"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET() {
  try {
    const profiles = await listActiveProfiles()

    return NextResponse.json(
      {
        success: true,
        profiles,
      },
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

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
