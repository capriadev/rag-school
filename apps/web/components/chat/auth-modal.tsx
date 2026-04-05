"use client"

import type { ChangeEvent, FormEvent } from "react"

type AuthModalProps = {
  email: string
  setEmail: (value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthModal({ email, setEmail, onClose, onSubmit }: AuthModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#2a2a3a] bg-[#111118] p-8">
        <h2 className="mb-6 font-sans text-2xl font-bold">Iniciar sesion</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#55556f]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-4 py-3 transition focus:border-[#5b4cff] focus:outline-none"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
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
  )
}
