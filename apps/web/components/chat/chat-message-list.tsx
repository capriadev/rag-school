"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import type { ChatMessage } from "./types"

type ChatMessageListProps = {
  messages: ChatMessage[]
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {messages.map((msg, idx) => (
        <div key={idx} className="flex gap-4">
          <div className="flex-1">
            <div className={`text-sm ${msg.role === "user" ? "font-semibold text-[#ececf7]" : "text-[#b4b4c6]"}`}>
              {msg.role === "user" ? "TÃº" : "RAG Custom"}
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
                {msg.content || (msg.role === "assistant" ? "â–Œ" : "")}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
