import { NextResponse } from "next/server"
import { getProfiles } from "../../../lib/server/supabase"

export const runtime = "nodejs"

export async function GET() {
  try {
    const profiles = await getProfiles()

    return NextResponse.json({
      success: true,
      profiles,
    })
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
