"use client"

type ChatSidebarProps = {
  sidebarExpanded: boolean
  setSidebarExpanded: (expanded: boolean) => void
  isAuthenticated: boolean
  onNewChat: () => void
  onOpenAuth: () => void
}

export function ChatSidebar({
  sidebarExpanded,
  setSidebarExpanded,
  isAuthenticated,
  onNewChat,
  onOpenAuth,
}: ChatSidebarProps) {
  return (
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
        onClick={onNewChat}
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
        onClick={onOpenAuth}
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
  )
}
