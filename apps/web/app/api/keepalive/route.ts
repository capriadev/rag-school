import { NextResponse } from "next/server"
import { pingVectorStore } from "../../../lib/server/supabase"

export const runtime = "nodejs"

export async function GET() {
  try {
    const result = await pingVectorStore()

    return NextResponse.json({
      ok: true,
      service: "supabase",
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Keepalive failed"

    return NextResponse.json(
      {
        ok: false,
        service: "supabase",
        error: message,
      },
      { status: 500 },
    )
  }
}
