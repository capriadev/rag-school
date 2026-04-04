import { NextResponse } from "next/server"
import { getVectorStoreMetrics } from "../../../../lib/server/supabase"

export const runtime = "nodejs"

export async function GET() {
  try {
    const metrics = await getVectorStoreMetrics()

    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar las metricas."

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
