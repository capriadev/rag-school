import type { ChatMessage } from "../../components/chat/types"
import type { QueryResponseDto } from "@rag/contracts"

export async function streamChatCompletion(
  message: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, stream: true }),
  })

  if (!response.body) {
    throw new Error("No response body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split("\n\n")

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue

      const data = line.slice(6)
      if (data === "[DONE]") continue

      try {
        const parsed = JSON.parse(data) as { chunk?: string; error?: string }

        if (parsed.chunk) {
          onChunk(parsed.chunk)
          continue
        }

        if (parsed.error) {
          onError(parsed.error)
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export async function queryRagAnswer(params: {
  question: string
  chunkCount: number
  selectedProfile: string
  context: ChatMessage[]
}): Promise<QueryResponseDto> {
  const { question, chunkCount, selectedProfile, context } = params

  const response = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      chunkCount,
      profileId: Number(selectedProfile),
      context: context.filter((message) => message.content.trim() !== ""),
    }),
  })

  return response.json() as Promise<QueryResponseDto>
}
