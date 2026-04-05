"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import "katex/dist/katex.min.css"
import { useProfiles } from "../lib/client/use-profiles"
import { useChatSession } from "../lib/client/use-chat-session"
import { AuthModal } from "./chat/auth-modal"
import { ChatComposer } from "./chat/chat-composer"
import { ChatMessageList } from "./chat/chat-message-list"
import { ChatSidebar } from "./chat/chat-sidebar"

export function ChatInterface() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [email, setEmail] = useState("")

  const {
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
  } = useChatSession()

  const { profiles, profilesLoading, loadProfiles } = useProfiles(selectedProfile, setSelectedProfile)

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsAuthenticated(true)
    setShowAuthModal(false)
  }

  const handleNewChat = () => {
    resetSession()
    loadProfiles()
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-[#ececf7]">
      <ChatSidebar
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        isAuthenticated={isAuthenticated}
        onNewChat={handleNewChat}
        onOpenAuth={() => setShowAuthModal(true)}
      />

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
                maxContextTokens={maxContextTokens}
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
                maxContextTokens={maxContextTokens}
              />
            </div>
          </>
        )}
      </div>

      {showAuthModal && <AuthModal email={email} setEmail={setEmail} onClose={() => setShowAuthModal(false)} onSubmit={handleAuth} />}
    </div>
  )
}
