import { NextResponse } from "next/server"
import { generateChatResponse, generateChatResponseStream } from "../../../lib/server/chat"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: unknown
      stream?: boolean
    }
    const message = String(body.message || "").trim()
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

    // Non-streaming response
    if (!useStream) {
      const response = await generateChatResponse(message)
      return NextResponse.json({
        success: true,
        response,
      })
    }

    // Streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generateChatResponseStream(message)) {
            const data = `data: ${JSON.stringify({ chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Stream error"
          const data = `data: ${JSON.stringify({ error: errorMessage })}\n\n`
          controller.enqueue(encoder.encode(data))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
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
