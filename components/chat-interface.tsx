"use client"

import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"

const CHUNK_OPTIONS = [4, 8, 12, 16]

interface ChatInterfaceProps {
  profileName?: string
}

export function ChatInterface({ profileName = "Custom" }: ChatInterfaceProps) {
  const [question, setQuestion] = useState("")
  const [chunkCount, setChunkCount] = useState(8)
  const [selectedProfile, setSelectedProfile] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [email, setEmail] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!question.trim()) return

    // Add user message
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

  return (
    <div className="flex h-screen bg-shell text-[#ececf7]">
      <div className="bg-grid pointer-events-none fixed inset-0 z-0" />

      {/* Sidebar - Only show when authenticated */}
      {isAuthenticated && (
        <aside className="relative z-10 w-64 border-r border-[#2a2a3a] bg-[rgba(17,17,24,0.92)] p-4 backdrop-blur-[16px]">
          <div className="mb-4">
            <h3 className="section-kicker">Historial</h3>
          </div>

          {/* Chat list */}
          <div className="flex-1 space-y-2">
            {/* TODO: Map saved chats */}
          </div>

          {/* Storage indicator */}
          <div className="mt-auto border-t border-[#2a2a3a] pt-4">
            <div className="text-xs text-[#8e8ea9]">
              <div className="mb-1 font-semibold">Storage</div>
              <div>0 / 100 MB</div>
            </div>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#2a2a3a] px-6 py-4">
          <div>
            <h1 className="font-sans text-[32px] font-extrabold tracking-[-1px]">
              RAG <span className="text-[#5b4cff]">{profileName}</span>
            </h1>
            <p className="text-[11px] uppercase tracking-[2px] text-[#55556f]">Customs</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile selector */}
            <select
              value={selectedProfile}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProfile(e.target.value)}
              className="form-control min-h-[50px] cursor-pointer appearance-none px-4 py-2 text-sm"
            >
              <option value="">Seleccionar RAG</option>
              {/* TODO: Load from DB */}
            </select>

            {/* Auth buttons */}
            {!isAuthenticated ? (
              <button
                className="rounded-full bg-gradient-to-br from-[#5b4cff] to-[#7a6cff] px-6 py-3 font-sans text-sm font-bold text-white shadow-[0_18px_40px_rgba(91,76,255,0.3)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(91,76,255,0.36)]"
                onClick={() => setShowAuthModal(true)}
              >
                Cuenta
              </button>
            ) : (
              <>
                <button className="rounded-full border border-[#2a2a3a] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-sm font-bold transition hover:border-[#5b4cff] hover:bg-[rgba(91,76,255,0.08)]">
                  Guardar chat
                </button>
                <button className="rounded-full border border-[#2a2a3a] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-sm font-bold transition hover:border-[#5b4cff] hover:bg-[rgba(91,76,255,0.08)]">
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
                Escribe tu consulta sobre {selectedProfile || "el RAG seleccionado"}
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
        <div className="border-t border-[#2a2a3a] px-6 py-4">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex gap-3">
              <textarea
                value={question}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                placeholder="¿Qué necesitas saber?"
                className="form-control flex-1 resize-none leading-relaxed"
                rows={1}
                style={{
                  minHeight: "50px",
                  maxHeight: "176px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "50px"
                  target.style.height = `${Math.min(target.scrollHeight, 176)}px`
                }}
              />
              
              {/* Chunk selector */}
              <select
                value={chunkCount}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setChunkCount(Number(e.target.value))}
                className="form-control min-h-[50px] w-[120px] cursor-pointer appearance-none text-sm"
              >
                {CHUNK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} chunks
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="rounded-full bg-gradient-to-br from-[#5b4cff] to-[#7a6cff] px-6 py-3 font-sans text-sm font-bold text-white shadow-[0_18px_40px_rgba(91,76,255,0.3)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(91,76,255,0.36)]"
              >
                Consultar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-8">
            <h2 className="mb-6 font-sans text-2xl font-bold">Iniciar sesión</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="section-kicker mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="form-control"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 rounded-full border border-[#2a2a3a] bg-[rgba(255,255,255,0.03)] px-6 py-3 font-sans text-sm font-bold transition hover:border-[#5b4cff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-gradient-to-br from-[#5b4cff] to-[#7a6cff] px-6 py-3 font-sans text-sm font-bold text-white shadow-[0_18px_40px_rgba(91,76,255,0.3)] transition duration-200 hover:-translate-y-0.5"
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
