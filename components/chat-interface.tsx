"use client"

import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"

const CHUNK_OPTIONS = [1, 3, 5, 7, 9, 15]

export function ChatInterface() {
  const [question, setQuestion] = useState("")
  const [chunkCount, setChunkCount] = useState(5)
  const [selectedProfile, setSelectedProfile] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [email, setEmail] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [hasStartedChat, setHasStartedChat] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!question.trim()) return

    setHasStartedChat(true)
    setMessages((prev) => [...prev, { role: "user", content: question }])
    setQuestion("")

    // TODO: Call API and add assistant response
  }

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: Firebase auth
    setIsAuthenticated(true)
    setShowAuthModal(false)
  }

  const handleNewChat = () => {
    setMessages([])
    setHasStartedChat(false)
    setQuestion("")
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-[#ececf7]">
      {/* Compact Sidebar */}
      <aside
        className={`flex flex-col border-r border-[#1f1f23] bg-[#0a0a0f] transition-all duration-200 ${
          sidebarExpanded ? "w-64" : "w-12"
        }`}
      >
        <div className="flex h-14 items-center justify-center border-b border-[#1f1f23]">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#8e8ea9] transition hover:bg-[#1f1f23]"
            title={sidebarExpanded ? "Contraer barra" : "Expandir barra"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex h-14 items-center justify-center border-b border-[#1f1f23]">
          <button
            onClick={handleNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#8e8ea9] transition hover:bg-[#1f1f23]"
            title="Nuevo chat"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {sidebarExpanded && (
          <div className="flex flex-1 flex-col overflow-hidden p-3">
            <div className="mb-2 px-2 text-xs font-semibold text-[#55556f]">Barra lateral</div>

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
                  {/* TODO: Map saved chats */}
                </div>
              </>
            )}
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header - Changes after first message */}
        {!hasStartedChat ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="mb-12 text-center">
              <h1 className="mb-2 font-sans text-5xl font-bold tracking-tight">
                RAG <span className="text-[#5b4cff]">Custom</span>
              </h1>
            </div>

            {/* Input area - Centered */}
            <div className="w-full max-w-3xl">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <textarea
                    value={question}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                    placeholder="Escribe tu consulta sobre el RAG seleccionado"
                    className="w-full resize-none rounded-2xl border border-[#2a2a3a] bg-[#111118] px-4 py-3 pr-12 text-sm leading-relaxed transition focus:border-[#5b4cff] focus:outline-none"
                    rows={1}
                    style={{
                      minHeight: "52px",
                      maxHeight: "200px",
                      overflow: "auto",
                      scrollbarWidth: "thin",
                      scrollbarColor: "#2a2a3a #111118",
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = "52px"
                      target.style.height = `${Math.min(target.scrollHeight, 200)}px`
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!question.trim()}
                    className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b4cff] text-white transition hover:bg-[#6c5cff] disabled:opacity-40"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 8l12-6-4 12-2-6-6-2z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Selectors below input */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative flex-1">
                    <select
                      value={selectedProfile}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProfile(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-lg border border-[#2a2a3a] bg-[#111118] px-3 py-2 pr-8 text-sm transition hover:border-[#5b4cff] focus:border-[#5b4cff] focus:outline-none"
                    >
                      <option value="">Seleccionar RAG</option>
                      {/* TODO: Load from DB */}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8e8ea9]"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div className="relative">
                    <select
                      value={chunkCount}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setChunkCount(Number(e.target.value))}
                      className="cursor-pointer appearance-none rounded-lg border border-[#2a2a3a] bg-[#111118] px-3 py-2 pr-8 text-sm transition hover:border-[#5b4cff] focus:border-[#5b4cff] focus:outline-none"
                    >
                      {CHUNK_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option} chunks
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8e8ea9]"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="rounded-lg bg-[#5b4cff] px-4 py-2 text-sm font-semibold transition hover:bg-[#6c5cff]"
                  >
                    {isAuthenticated ? "Cuenta" : "Conectar cuenta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Compact header after first message */}
            <header className="flex items-center justify-between border-b border-[#1f1f23] px-6 py-3">
              <h1 className="font-sans text-lg font-bold">
                RAG <span className="text-[#5b4cff]">Custom</span>
              </h1>

              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="rounded-lg bg-[#5b4cff] px-4 py-2 text-sm font-semibold transition hover:bg-[#6c5cff]"
              >
                {isAuthenticated ? "Cuenta" : "Conectar cuenta"}
              </button>
            </header>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-1">
                      <div className={`text-sm ${msg.role === "user" ? "font-semibold text-[#ececf7]" : "text-[#b4b4c6]"}`}>
                        {msg.role === "user" ? "Tú" : "RAG Custom"}
                      </div>
                      <div className="mt-1 text-[15px] leading-7">{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input area - Bottom */}
            <div className="border-t border-[#1f1f23] px-6 py-4">
              <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
                <div className="flex items-end gap-2">
                  <select
                    value={selectedProfile}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProfile(e.target.value)}
                    className="cursor-pointer rounded-lg border border-[#2a2a3a] bg-[#111118] px-3 py-2 text-sm transition hover:border-[#5b4cff] focus:border-[#5b4cff] focus:outline-none"
                  >
                    <option value="">RAG</option>
                    {/* TODO: Load from DB */}
                  </select>

                  <select
                    value={chunkCount}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setChunkCount(Number(e.target.value))}
                    className="cursor-pointer rounded-lg border border-[#2a2a3a] bg-[#111118] px-3 py-2 text-sm transition hover:border-[#5b4cff] focus:border-[#5b4cff] focus:outline-none"
                  >
                    {CHUNK_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <textarea
                      value={question}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                      placeholder="Escribe tu consulta..."
                      className="w-full resize-none rounded-2xl border border-[#2a2a3a] bg-[#111118] px-4 py-3 pr-12 text-sm leading-relaxed transition focus:border-[#5b4cff] focus:outline-none"
                      rows={1}
                      style={{
                        minHeight: "44px",
                        maxHeight: "200px",
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = "44px"
                        target.style.height = `${Math.min(target.scrollHeight, 200)}px`
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!question.trim()}
                      className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b4cff] text-white transition hover:bg-[#6c5cff] disabled:opacity-40"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M2 8l12-6-4 12-2-6-6-2z"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Auth Modal */}
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
