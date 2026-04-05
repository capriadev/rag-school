"use client"

import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import type { ChatMessage } from "../../components/chat/types"
import { queryRagAnswer, streamChatCompletion } from "./chat-api"

const PLACEHOLDERS = [
  "Escribe tu consulta...",
  "Que necesitas saber?",
  "Pregunta lo que quieras...",
  "En que puedo ayudarte?",
  "Hazme una pregunta...",
]

function resetComposerHeights() {
  const textareas = document.querySelectorAll("textarea")
  textareas.forEach((textarea) => {
    textarea.style.height = "28px"
  })
}

export function useChatSession() {
  const [question, setQuestion] = useState("")
  const [chunkCount, setChunkCount] = useState(5)
  const [selectedProfile, setSelectedProfile] = useState("chat")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0])

  const maxContextTokens = selectedProfile === "chat" ? 64000 : 32000

  const usedTokens = useMemo(() => {
    const estimateTokens = (text: string) => Math.ceil(text.length / 4)
    return messages.reduce((accumulator, message) => accumulator + estimateTokens(message.content), 0)
  }, [messages])

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * PLACEHOLDERS.length)
    setPlaceholder(PLACEHOLDERS[randomIndex])
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) return

    setHasStartedChat(true)
    setMessages((previous) => [...previous, { role: "user", content: trimmedQuestion }])
    setQuestion("")
    resetComposerHeights()

    if (selectedProfile === "chat") {
      try {
        setMessages((previous) => [...previous, { role: "assistant", content: "" }])

        let accumulatedResponse = ""
        await streamChatCompletion(
          trimmedQuestion,
          (chunk) => {
            accumulatedResponse += chunk
            setMessages((previous) => {
              const next = [...previous]
              next[next.length - 1] = { role: "assistant", content: accumulatedResponse }
              return next
            })
          },
          (error) => {
            setMessages((previous) => {
              const next = [...previous]
              next[next.length - 1] = { role: "assistant", content: `Error: ${error}` }
              return next
            })
          },
        )
      } catch {
        setMessages((previous) => [...previous, { role: "assistant", content: "Error de conexion con el servidor." }])
      }

      return
    }

    try {
      const result = await queryRagAnswer({
        question: trimmedQuestion,
        chunkCount,
        selectedProfile,
        context: messages,
      })

      if (result.success) {
        setMessages((previous) => [...previous, { role: "assistant", content: result.answer || "" }])
        return
      }

      setMessages((previous) => [...previous, { role: "assistant", content: `Error: ${result.error || "Unknown error"}` }])
    } catch {
      setMessages((previous) => [...previous, { role: "assistant", content: "Error de conexion con el servidor." }])
    }
  }

  const resetSession = () => {
    setMessages([])
    setHasStartedChat(false)
    setQuestion("")
  }

  return {
    question,
    setQuestion,
    chunkCount,
    setChunkCount,
    selectedProfile,
    setSelectedProfile,
    messages,
    hasStartedChat,
    placeholder,
    usedTokens,
    maxContextTokens,
    handleSubmit,
    resetSession,
  }
}
