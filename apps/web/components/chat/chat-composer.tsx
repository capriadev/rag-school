"use client"

import type { ChangeEvent, FormEvent } from "react"
import type { ProfileOption } from "./types"

const CHUNK_OPTIONS = [
  { value: 3, label: "Preciso" },
  { value: 5, label: "Balanceado" },
  { value: 7, label: "Completo" },
  { value: 9, label: "Amplio" },
  { value: 12, label: "Extendido" },
  { value: 15, label: "Exhaustivo" },
]

type ChatComposerProps = {
  className?: string
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  question: string
  setQuestion: (value: string) => void
  placeholder: string
  selectedProfile: string
  setSelectedProfile: (value: string) => void
  profiles: ProfileOption[]
  profilesLoading: boolean
  chunkCount: number
  setChunkCount: (value: number) => void
  usedTokens: number
  maxContextTokens: number
}

export function ChatComposer({
  className,
  onSubmit,
  question,
  setQuestion,
  placeholder,
  selectedProfile,
  setSelectedProfile,
  profiles,
  profilesLoading,
  chunkCount,
  setChunkCount,
  usedTokens,
  maxContextTokens,
}: ChatComposerProps) {
  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="relative">
        <div className="flex flex-col gap-2 rounded-2xl border border-[#2a2a3a] bg-[#111118] px-4 py-2 transition focus-within:border-[#5b4cff]">
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

          <div className="flex items-center gap-2">
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

            <div className="group relative flex items-center">
              <div className="relative h-7 w-24 overflow-hidden rounded-md border border-[#2a2a3a] bg-[#0a0a0f]">
                <div
                  className="absolute inset-y-0 left-0 bg-[#5b4cff]/20 transition-all duration-300"
                  style={{ width: `${Math.min((usedTokens / maxContextTokens) * 100, 100)}%` }}
                />
                <div
                  className="absolute bottom-0 left-0 h-[2px] bg-[#5b4cff] transition-all duration-300"
                  style={{ width: `${Math.min((usedTokens / maxContextTokens) * 100, 100)}%` }}
                />
                <div className="relative flex h-full items-center justify-center text-[10px] font-medium text-[#8e8ea9]">
                  {Math.min(Math.round((usedTokens / maxContextTokens) * 100), 100)}%
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-max rounded-md border border-[#2a2a3a] bg-[#111118] px-2 py-1 text-xs text-[#ececf7] opacity-0 transition-opacity group-hover:opacity-100">
                {usedTokens.toLocaleString()} / {maxContextTokens.toLocaleString()} Tokens context
              </div>
            </div>

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
  )
}
