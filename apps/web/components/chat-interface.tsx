"use client"

import { useState, useEffect } from "react"
import type { ChangeEvent, FormEvent } from "react"
import "katex/dist/katex.min.css"
import { useProfiles } from "../lib/client/use-profiles"
import { ChatComposer } from "./chat/chat-composer"
import { ChatMessageList } from "./chat/chat-message-list"
import type { ChatMessage } from "./chat/types"

const PLACEHOLDERS = [
  "Escribe tu consulta...",
  "¿Qué necesitas saber?",
  "Pregunta lo que quieras...",
  "¿En qué puedo ayudarte?",
  "Hazme una pregunta...",
]

export function ChatInterface() {
  const [question, setQuestion] = useState("")
  const [chunkCount, setChunkCount] = useState(5)
  const [selectedProfile, setSelectedProfile] = useState("chat")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [email, setEmail] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0])
  const { profiles, profilesLoading, loadProfiles } = useProfiles(selectedProfile, setSelectedProfile)

  const MAX_CONTEXT_TOKENS = selectedProfile === "chat" ? 64000 : 32000
  const [usedTokens, setUsedTokens] = useState(0)

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * PLACEHOLDERS.length)
    setPlaceholder(PLACEHOLDERS[randomIndex])
  }, [])

  useEffect(() => {
    const estimateTokens = (text: string) => Math.ceil(text.length / 4)
    const total = messages.reduce((acc, msg) => acc + estimateTokens(msg.content), 0)
    setUsedTokens(total)
  }, [messages])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!question.trim()) return

    setHasStartedChat(true)
    setMessages((prev) => [...prev, { role: "user", content: question }])
    setQuestion("")

    const textareas = document.querySelectorAll("textarea")
    textareas.forEach((textarea) => {
      textarea.style.height = "28px"
    })

    if (selectedProfile === "chat") {
      try {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }])

        const context = messages.filter((m) => m.content.trim() !== "")

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question, stream: true, context }),
        })

        if (!response.body) {
          throw new Error("No response body")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedResponse = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.chunk) {
                  accumulatedResponse += parsed.chunk
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: accumulatedResponse,
                    }
                    return newMessages
                  })
                } else if (parsed.error) {
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: `Error: ${parsed.error}`,
                    }
                    return newMessages
                  })
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión con el servidor." }])
      }
      return
    }

    if (selectedProfile) {
      try {
        const context = messages.filter((m) => m.content.trim() !== "")

        const response = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            chunkCount,
            profileId: Number(selectedProfile),
            context,
          }),
        })
        const data = await response.json()
        if (data.success) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.answer }])
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error}` }])
        }
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión con el servidor." }])
      }
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: "Por favor selecciona un perfil RAG." }])
    }
  }

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsAuthenticated(true)
    setShowAuthModal(false)
  }

  const handleNewChat = () => {
    setMessages([])
    setHasStartedChat(false)
    setQuestion("")
    loadProfiles()
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-[#ececf7]">
      <aside
        className={`flex flex-col border-r border-[#1f1f23] bg-[#0a0a0f] transition-all duration-200 ${
          sidebarExpanded ? "w-64" : "w-12"
        }`}
      >
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="flex h-14 w-full items-center gap-3 border-b border-[#1f1f23] px-3 text-[#8e8ea9] transition hover:bg-[#1f1f23]"
          title={sidebarExpanded ? "Contraer barra" : "Expandir barra"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {sidebarExpanded && <span className="hidden text-sm font-medium md:inline">Ocultar barra lateral</span>}
          {sidebarExpanded && <span className="text-sm font-medium md:hidden">Ocultar</span>}
        </button>

        <button
          onClick={handleNewChat}
          className="flex h-14 w-full items-center gap-3 border-b border-[#1f1f23] px-3 text-[#8e8ea9] transition hover:bg-[#1f1f23]"
          title="Nuevo chat"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {sidebarExpanded && <span className="text-sm font-medium">Nuevo chat</span>}
        </button>

        {sidebarExpanded && (
          <div className="flex flex-1 flex-col overflow-hidden p-3">
            {isAuthenticated && (
              <>
                <div className="mb-3 border-t border-[#1f1f23] pt-3">
                  <div className="px-2 text-xs text-[#8e8ea9]">
                    <div className="mb-1 font-semibold">Storage</div>
                    <div>0 / 100 MB</div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="px-2 text-xs text-[#55556f]">Chats guardados</div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setShowAuthModal(true)}
          className="mt-auto flex h-14 w-full items-center gap-3 border-t border-[#1f1f23] bg-[#5b4cff] px-3 text-white transition hover:bg-[#6c5cff]"
          title={isAuthenticated ? "Cuenta" : "Conectar cuenta"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 13c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {sidebarExpanded && <span className="text-sm font-medium">{isAuthenticated ? "Cuenta" : "Conectar cuenta"}</span>}
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        {!hasStartedChat ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="mb-8 rounded-lg bg-[#5b4cff] px-4 py-2 text-xs font-semibold transition hover:bg-[#6c5cff]"
            >
              {isAuthenticated ? "Cuenta" : "Conectar cuenta"}
            </button>

            <div className="mb-12 text-center">
              <h1 className="mb-2 font-sans text-5xl font-bold tracking-tight">
                RAG <span className="text-[#5b4cff]">Custom</span>
              </h1>
            </div>

            <div className="w-full px-4 md:max-w-3xl md:px-0">
              <ChatComposer
                onSubmit={handleSubmit}
                question={question}
                setQuestion={setQuestion}
                placeholder={placeholder}
                selectedProfile={selectedProfile}
                setSelectedProfile={setSelectedProfile}
                profiles={profiles}
                profilesLoading={profilesLoading}
                chunkCount={chunkCount}
                setChunkCount={setChunkCount}
                usedTokens={usedTokens}
                maxContextTokens={MAX_CONTEXT_TOKENS}
              />
            </div>
          </div>
        ) : (
          <>
            <header className="flex h-14 items-center justify-between border-b border-[#1f1f23] px-6">
              <h1 className="font-sans text-lg font-bold">
                RAG <span className="text-[#5b4cff]">Custom</span>
              </h1>
            </header>

            <div className="flex-1 overflow-y-auto px-6 pb-32 pt-6">
              <ChatMessageList messages={messages} />
            </div>

            <div className="relative px-6 py-2">
              <ChatComposer
                className="mx-auto w-full md:max-w-3xl"
                onSubmit={handleSubmit}
                question={question}
                setQuestion={setQuestion}
                placeholder={placeholder}
                selectedProfile={selectedProfile}
                setSelectedProfile={setSelectedProfile}
                profiles={profiles}
                profilesLoading={profilesLoading}
                chunkCount={chunkCount}
                setChunkCount={setChunkCount}
                usedTokens={usedTokens}
                maxContextTokens={MAX_CONTEXT_TOKENS}
              />
            </div>
          </>
        )}
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#2a2a3a] bg-[#111118] p-8">
            <h2 className="mb-6 font-sans text-2xl font-bold">Iniciar sesión</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#55556f]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-4 py-3 transition focus:border-[#5b4cff] focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 rounded-lg border border-[#2a2a3a] px-6 py-3 text-sm font-semibold transition hover:border-[#5b4cff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#5b4cff] px-6 py-3 text-sm font-semibold transition hover:bg-[#6c5cff]"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
