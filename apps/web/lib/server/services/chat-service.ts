import { generateChatResponse, generateChatResponseStream } from "../chat"

export function parseChatMessage(value: unknown): string {
  return String(value || "").trim()
}

export function buildChatStreamResponse(message: string): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generateChatResponseStream(message)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Stream error"
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
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
}

export async function buildChatJsonResponse(message: string): Promise<{ success: boolean; response: string }> {
  const response = await generateChatResponse(message)
  return {
    success: true,
    response,
  }
}
