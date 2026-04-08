import { NextResponse } from "next/server"
import { buildChatJsonResponse, buildChatStreamResponse, parseChatMessage } from "../../../lib/server/services/chat-service"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: unknown
      stream?: boolean
    }

    const message = parseChatMessage(body.message)
    const useStream = body.stream === true

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "El mensaje es obligatorio.",
        },
        { status: 400 },
      )
    }

    if (!useStream) {
      const payload = await buildChatJsonResponse(message)
      return NextResponse.json(payload)
    }

    return buildChatStreamResponse(message)
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
