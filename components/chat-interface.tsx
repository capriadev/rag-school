"use client"

import { useState, useEffect, useCallback } from "react"
import type { ChangeEvent, FormEvent } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

const CHUNK_OPTIONS = [
  { value: 3, label: "Preciso" },
  { value: 5, label: "Balanceado" },
  { value: 7, label: "Completo" },
  { value: 9, label: "Amplio" },
  { value: 12, label: "Extendido" },
  { value: 15, label: "Exhaustivo" },
]

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
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0])
  const [profiles, setProfiles] = useState<Array<{ id_profile: number; name: string; description: string | null }>>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true)
    try {
      const response = await fetch(`/api/profiles?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()
      if (data.success && Array.isArray(data.profiles)) {
        setProfiles(data.profiles)
        return
      }
      setProfiles([])
    } catch (error) {
      console.error("Failed to load profiles:", error)
      setProfiles([])
    } finally {
      setProfilesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProfile === "chat") return

    const selectedId = Number(selectedProfile)
    if (Number.isNaN(selectedId)) {
      setSelectedProfile("chat")
      return
    }

    const stillExists = profiles.some((p) => p.id_profile === selectedId)
    if (!stillExists) {
      setSelectedProfile("chat")
    }
  }, [profiles, selectedProfile])

  // Token tracking - dynamic based on mode (CHAT uses 64k for Gemma, RAG varies)
  const MAX_CONTEXT_TOKENS = selectedProfile === "chat" ? 64000 : 32000
  const [usedTokens, setUsedTokens] = useState(0)

  // Load profiles from API on mount and when tab becomes visible/focused
  useEffect(() => {
    loadProfiles()
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadProfiles()
      }
    }
    const handleFocus = () => {
      loadProfiles()
    }
    const handlePageShow = () => {
      loadProfiles()
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("pageshow", handlePageShow)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [loadProfiles])

  // Rotate placeholder on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * PLACEHOLDERS.length)
    setPlaceholder(PLACEHOLDERS[randomIndex])
  }, [])

  // Calculate token usage based on messages
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

    // Reset textarea height
    const textareas = document.querySelectorAll('textarea')
    textareas.forEach((textarea) => {
      textarea.style.height = "28px"
    })

    // CHAT mode - use AI Studio Gemma with streaming
    if (selectedProfile === "chat") {
      try {
        // Add empty assistant message for streaming
        setMessages((prev) => [...prev, { role: "assistant", content: "" }])

        // Get conversation context (all messages except the empty assistant one we just added)
        const context = messages.filter(m => m.content.trim() !== "")

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
      } catch (error) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión con el servidor." }])
      }
      return
    }

    // RAG mode - use query API with profile and chunks
    if (selectedProfile) {
      try {
        // Get conversation context
        const context = messages.filter(m => m.content.trim() !== "")

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
      } catch (error) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión con el servidor." }])
      }
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: "Por favor selecciona un perfil RAG." }])
    }
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
    loadProfiles()
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
            <div className="w-full px-4 md:max-w-3xl md:px-0">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="flex flex-col gap-2 rounded-2xl border border-[#2a2a3a] bg-[#111118] px-4 py-2 transition focus-within:border-[#5b4cff]">
                    {/* Textarea - Always first on mobile and desktop */}
                    <textarea
                      value={question}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                      placeholder={placeholder}
                      className="w-full resize-none bg-transparent py-1 text-sm leading-relaxed focus:outline-none"
                      rows={1}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                          e.preventDefault()
                          if (question.trim()) {
                            const form = e.currentTarget.closest("form")
                            form?.requestSubmit()
                          }
                        }
                      }}
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
                      <div className="relative flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8e8ea9]">
                          <path d="M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1"/>
                          <path d="m21 21-1.9-1.9"/>
                          <circle cx="17" cy="17" r="3"/>
                        </svg>
                        <select
                          value={selectedProfile}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProfile(e.target.value)}
                          disabled={profilesLoading}
                          className="cursor-pointer appearance-none bg-transparent py-1 pr-6 text-xs text-[#8e8ea9] transition hover:text-[#ececf7] focus:outline-none disabled:opacity-50"
                        >
                          <option value="chat">Chat</option>
                          {profilesLoading ? (
                            <option value="" disabled>...</option>
                          ) : profiles.length === 0 ? (
                            <option value="" disabled>Sin RAGs</option>
                          ) : (
                            profiles.map((profile) => (
                              <option key={profile.id_profile} value={profile.id_profile}>
                                {profile.name}
                              </option>
                            ))
                          )}
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

                      {/* Chunks Select - Hidden in CHAT mode */}
                      {selectedProfile !== "chat" && (
                        <div className="relative flex items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8e8ea9]">
                            <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
                            <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
                            <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
                          </svg>
                          <select
                            value={chunkCount}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setChunkCount(Number(e.target.value))}
                            className="cursor-pointer appearance-none bg-transparent py-1 pr-6 text-xs text-[#8e8ea9] transition hover:text-[#ececf7] focus:outline-none"
                          >
                            {CHUNK_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
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
                      )}

                      <div className="flex-1" />

                      {/* Token Usage Progress Bar */}
                      <div className="group relative flex items-center">
                        <div className="relative h-7 w-24 overflow-hidden rounded-md border border-[#2a2a3a] bg-[#0a0a0f]">
                          {/* Progress fill - border style from left to right */}
                          <div
                            className="absolute inset-y-0 left-0 bg-[#5b4cff]/20 transition-all duration-300"
                            style={{ width: `${Math.min((usedTokens / MAX_CONTEXT_TOKENS) * 100, 100)}%` }}
                          />
                          {/* Border progress indicator */}
                          <div
                            className="absolute bottom-0 left-0 h-[2px] bg-[#5b4cff] transition-all duration-300"
                            style={{ width: `${Math.min((usedTokens / MAX_CONTEXT_TOKENS) * 100, 100)}%` }}
                          />
                          {/* Percentage text */}
                          <div className="relative flex h-full items-center justify-center text-[10px] font-medium text-[#8e8ea9]">
                            {Math.min(Math.round((usedTokens / MAX_CONTEXT_TOKENS) * 100), 100)}%
                          </div>
                        </div>
                        {/* Tooltip on hover */}
                        <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-max rounded-md border border-[#2a2a3a] bg-[#111118] px-2 py-1 text-xs text-[#ececf7] opacity-0 transition-opacity group-hover:opacity-100">
                          {usedTokens.toLocaleString()} / {MAX_CONTEXT_TOKENS.toLocaleString()} Tokens context
                        </div>
                      </div>

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
                      <div className="prose prose-invert prose-sm mt-1 max-w-none text-[15px] leading-7">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            code: ({ children, className }) => (
                              <code className={`${className} rounded bg-[#2a2a3a] px-1.5 py-0.5 text-sm`}>
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="mb-2 overflow-x-auto rounded-lg bg-[#1f1f23] p-3">{children}</pre>
                            ),
                          }}
                        >
                          {msg.content || (msg.role === "assistant" ? "▌" : "")}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input area - Bottom */}
            <div className="relative px-6 py-2">
              <form onSubmit={handleSubmit} className="mx-auto w-full md:max-w-3xl">
                <div className="relative">
                  <div className="flex flex-col gap-2 rounded-2xl border border-[#2a2a3a] bg-[#111118] px-4 py-2 transition focus-within:border-[#5b4cff]">
                    {/* Textarea - Always first */}
                    <textarea
                      value={question}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                      placeholder={placeholder}
                      className="w-full resize-none bg-transparent py-1 text-sm leading-relaxed focus:outline-none"
                      rows={1}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                          e.preventDefault()
                          if (question.trim()) {
                            const form = e.currentTarget.closest("form")
                            form?.requestSubmit()
                          }
                        }
                      }}
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
                      <div className="relative flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8e8ea9]">
                          <path d="M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1"/>
                          <path d="m21 21-1.9-1.9"/>
                          <circle cx="17" cy="17" r="3"/>
                        </svg>
                        <select
                          value={selectedProfile}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProfile(e.target.value)}
                          disabled={profilesLoading}
                          className="cursor-pointer appearance-none bg-transparent py-1 pr-6 text-xs text-[#8e8ea9] transition hover:text-[#ececf7] focus:outline-none disabled:opacity-50"
                        >
                          <option value="chat">Chat</option>
                          {profilesLoading ? (
                            <option value="" disabled>...</option>
                          ) : profiles.length === 0 ? (
                            <option value="" disabled>Sin RAGs</option>
                          ) : (
                            profiles.map((profile) => (
                              <option key={profile.id_profile} value={profile.id_profile}>
                                {profile.name}
                              </option>
                            ))
                          )}
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

                      {/* Chunks Select - Hidden in CHAT mode */}
                      {selectedProfile !== "chat" && (
                        <div className="relative flex items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8e8ea9]">
                            <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
                            <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
                            <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
                          </svg>
                          <select
                            value={chunkCount}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setChunkCount(Number(e.target.value))}
                            className="cursor-pointer appearance-none bg-transparent py-1 pr-6 text-xs text-[#8e8ea9] transition hover:text-[#ececf7] focus:outline-none"
                          >
                            {CHUNK_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
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
                      )}

                      <div className="flex-1" />

                      {/* Token Usage Progress Bar */}
                      <div className="group relative flex items-center">
                        <div className="relative h-7 w-24 overflow-hidden rounded-md border border-[#2a2a3a] bg-[#0a0a0f]">
                          {/* Progress fill - border style from left to right */}
                          <div
                            className="absolute inset-y-0 left-0 bg-[#5b4cff]/20 transition-all duration-300"
                            style={{ width: `${Math.min((usedTokens / MAX_CONTEXT_TOKENS) * 100, 100)}%` }}
                          />
                          {/* Border progress indicator */}
                          <div
                            className="absolute bottom-0 left-0 h-[2px] bg-[#5b4cff] transition-all duration-300"
                            style={{ width: `${Math.min((usedTokens / MAX_CONTEXT_TOKENS) * 100, 100)}%` }}
                          />
                          {/* Percentage text */}
                          <div className="relative flex h-full items-center justify-center text-[10px] font-medium text-[#8e8ea9]">
                            {Math.min(Math.round((usedTokens / MAX_CONTEXT_TOKENS) * 100), 100)}%
                          </div>
                        </div>
                        {/* Tooltip on hover */}
                        <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-max rounded-md border border-[#2a2a3a] bg-[#111118] px-2 py-1 text-xs text-[#ececf7] opacity-0 transition-opacity group-hover:opacity-100">
                          {usedTokens.toLocaleString()} / {MAX_CONTEXT_TOKENS.toLocaleString()} Tokens context
                        </div>
                      </div>

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
