import { NextResponse } from "next/server"
import { generateChatResponse } from "../../../lib/server/chat"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: unknown
    }
    const message = String(body.message || "").trim()

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "El mensaje es obligatorio.",
        },
        { status: 400 },
      )
    }

    const response = await generateChatResponse(message)

    return NextResponse.json({
      success: true,
      response,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed"

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
