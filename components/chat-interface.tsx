"use client"

import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"

const CHUNK_OPTIONS = [4, 8, 12, 16]

interface ChatInterfaceProps {
  profileName?: string
}

export function ChatInterface({ profileName = "Civil" }: ChatInterfaceProps) {
  const [question, setQuestion] = useState("")
  const [chunkCount, setChunkCount] = useState(8)
  const [selectedProfile, setSelectedProfile] = useState(profileName)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!question.trim()) return

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: question }])
    setQuestion("")

    // TODO: Call API and add assistant response
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-[#ececf7]">
      {/* Sidebar - Only show when authenticated */}
      {isAuthenticated && (
        <aside className="w-64 border-r border-[#1a1a24] bg-[#0f0f14] p-4">
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#55556f]">Historial</h3>
          </div>

          {/* Chat list */}
          <div className="flex-1 space-y-2">
            {/* TODO: Map saved chats */}
          </div>

          {/* Storage indicator */}
          <div className="mt-auto border-t border-[#1a1a24] pt-4">
            <div className="text-xs text-[#8e8ea9]">
              <div className="mb-1 font-semibold">Storage</div>
              <div>0 / 100 MB</div>
            </div>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#1a1a24] px-6 py-4">
          <div>
            <h1 className="font-sans text-2xl font-bold">
              RAG <span className="text-[#5b4cff]">{selectedProfile}</span>
            </h1>
            <p className="text-xs uppercase tracking-wider text-[#55556f]">Customs</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile selector */}
            <select
              value={selectedProfile}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProfile(e.target.value)}
              className="rounded-lg border border-[#2a2a3a] bg-[#111118] px-4 py-2 text-sm transition hover:border-[#5b4cff]"
            >
              <option value="Civil">Civil</option>
              <option value="School">School</option>
              <option value="UBA">UBA</option>
            </select>

            {/* Chunk selector */}
            <select
              value={chunkCount}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setChunkCount(Number(e.target.value))}
              className="rounded-lg border border-[#2a2a3a] bg-[#111118] px-4 py-2 text-sm transition hover:border-[#5b4cff]"
            >
              {CHUNK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} chunks
                </option>
              ))}
            </select>

            {/* Auth buttons */}
            {!isAuthenticated ? (
              <button
                className="rounded-lg bg-[#5b4cff] px-4 py-2 text-sm font-semibold transition hover:bg-[#6c5cff]"
                onClick={() => setIsAuthenticated(true)}
              >
                Cuenta
              </button>
            ) : (
              <>
                <button className="rounded-lg border border-[#2a2a3a] bg-[#111118] px-4 py-2 text-sm font-semibold transition hover:border-[#5b4cff]">
                  Guardar chat
                </button>
                <button className="rounded-lg border border-[#2a2a3a] bg-[#111118] px-4 py-2 text-sm font-semibold transition hover:border-[#5b4cff]">
                  Nuevo chat
                </button>
              </>
            )}
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-[#55556f]">
                Escribe tu consulta sobre {selectedProfile}
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`inline-block rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-[#5b4cff] text-white"
                        : "border border-[#2a2a3a] bg-[#111118] text-[#ececf7]"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[#1a1a24] px-6 py-4">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex gap-3">
              <textarea
                value={question}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                placeholder="¿Qué necesitas saber?"
                className="flex-1 resize-none rounded-lg border border-[#2a2a3a] bg-[#111118] px-4 py-3 text-sm leading-relaxed transition focus:border-[#5b4cff] focus:outline-none"
                rows={1}
                style={{
                  minHeight: "44px",
                  maxHeight: "176px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "44px"
                  target.style.height = `${Math.min(target.scrollHeight, 176)}px`
                }}
              />
              <button
                type="submit"
                className="rounded-lg bg-[#5b4cff] px-6 py-3 text-sm font-semibold transition hover:bg-[#6c5cff]"
              >
                Consultar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
