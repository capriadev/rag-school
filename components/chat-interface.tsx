"use client"

import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"

const CHUNK_OPTIONS = [1, 3, 5, 7, 9, 15]

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
  const [selectedProfile, setSelectedProfile] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [email, setEmail] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0])

  // Rotate placeholder on mount
  useState(() => {
    const randomIndex = Math.floor(Math.random() * PLACEHOLDERS.length)
    setPlaceholder(PLACEHOLDERS[randomIndex])
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!question.trim()) return

    setHasStartedChat(true)
    setMessages((prev) => [...prev, { role: "user", content: question }])
    setQuestion("")

    // Reset textarea height
    const textareas = document.querySelectorAll('textarea')
    textareas.forEach((textarea) => {
      textarea.style.height = "28px"
    })

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
        {/* Toggle button */}
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

        {/* New chat button */}
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
                  {/* TODO: Map saved chats */}
                </div>
              </>
            )}
          </div>
        )}

        {/* Account button at bottom */}
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

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header - Changes after first message */}
        {!hasStartedChat ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            {/* Account button above title */}
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

            {/* Input area - Centered */}
            <div className="w-full max-w-3xl">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="flex flex-col gap-2 rounded-2xl border border-[#2a2a3a] bg-[#111118] p-3 transition focus-within:border-[#5b4cff]">
                    {/* Textarea - Always first on mobile and desktop */}
                    <textarea
                      value={question}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                      placeholder={placeholder}
                      className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-relaxed focus:outline-none"
                      rows={1}
                      style={{
                        minHeight: "28px",
                        maxHeight: "120px",
                        overflow: "auto",
                        scrollbarWidth: "thin",
                        scrollbarColor: "#2a2a3a transparent",
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = "28px"
                        target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                      }}
                    />

                    {/* Selects and button row */}
                    <div className="flex items-center gap-2">
                      {/* RAG Select */}
                      <div className="relative">
                        <select
                          value={selectedProfile}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProfile(e.target.value)}
                          className="cursor-pointer appearance-none bg-transparent px-2 py-1 pr-6 text-xs text-[#8e8ea9] transition hover:text-[#ececf7] focus:outline-none"
                        >
                          <option value="">RAG</option>
                          {/* TODO: Load from DB */}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#8e8ea9]"
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="h-4 w-px bg-[#2a2a3a]" />

                      {/* Chunks Select */}
                      <div className="relative">
                        <select
                          value={chunkCount}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setChunkCount(Number(e.target.value))}
                          className="cursor-pointer appearance-none bg-transparent px-2 py-1 pr-6 text-xs text-[#8e8ea9] transition hover:text-[#ececf7] focus:outline-none"
                        >
                          {CHUNK_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option} chunks
                            </option>
                          ))}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#8e8ea9]"
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="flex-1" />

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!question.trim()}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#5b4cff] text-white transition hover:bg-[#6c5cff] disabled:opacity-40"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M1.5 7l11-5-3.5 11-1.75-5.25L1.5 7z"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="0.8"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Compact header after first message */}
            <header className="flex h-14 items-center justify-between border-b border-[#1f1f23] px-6">
              <h1 className="font-sans text-lg font-bold">
                RAG <span className="text-[#5b4cff]">Custom</span>
              </h1>
            </header>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-6 pb-32 pt-6">
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
            <div className="relative border-t border-[#1f1f23] px-6 py-4">
              <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
                <div className="relative">
                  <div className="flex flex-col gap-2 rounded-2xl border border-[#2a2a3a] bg-[#111118] p-3 transition focus-within:border-[#5b4cff]">
                    {/* Textarea - Always first */}
                    <textarea
                      value={question}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                      placeholder={placeholder}
                      className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-relaxed focus:outline-none"
                      rows={1}
                      style={{
                        minHeight: "28px",
                        maxHeight: "120px",
                        overflow: "auto",
                        scrollbarWidth: "thin",
                        scrollbarColor: "#2a2a3a transparent",
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = "28px"
                        target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                      }}
                    />

                    {/* Selects and button row */}
                    <div className="flex items-center gap-2">
                      {/* RAG Select */}
                      <div className="relative">
                        <select
                          value={selectedProfile}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProfile(e.target.value)}
                          className="cursor-pointer appearance-none bg-transparent px-2 py-1 pr-6 text-xs text-[#8e8ea9] transition hover:text-[#ececf7] focus:outline-none"
                        >
                          <option value="">RAG</option>
                          {/* TODO: Load from DB */}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#8e8ea9]"
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="h-4 w-px bg-[#2a2a3a]" />

                      {/* Chunks Select */}
                      <div className="relative">
                        <select
                          value={chunkCount}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setChunkCount(Number(e.target.value))}
                          className="cursor-pointer appearance-none bg-transparent px-2 py-1 pr-6 text-xs text-[#8e8ea9] transition hover:text-[#ececf7] focus:outline-none"
                        >
                          {CHUNK_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option} chunks
                            </option>
                          ))}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#8e8ea9]"
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="flex-1" />

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!question.trim()}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#5b4cff] text-white transition hover:bg-[#6c5cff] disabled:opacity-40"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M1.5 7l11-5-3.5 11-1.75-5.25L1.5 7z"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="0.8"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
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
