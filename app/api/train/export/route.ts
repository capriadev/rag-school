import { exportVectorStoreSnapshot } from "../../../../lib/server/supabase"

export const runtime = "nodejs"

export async function GET() {
  try {
    const snapshot = await exportVectorStoreSnapshot()
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

    return new Response(JSON.stringify(snapshot, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="vector-store-${timestamp}.json"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo exportar la base vectorial."

    return Response.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
