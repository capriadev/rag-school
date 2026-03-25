import "./globals.css"
import { IBM_Plex_Mono, Syne } from "next/font/google"
import type { Metadata } from "next"
import type { ReactNode } from "react"

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
})

const sans = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sans",
})

export const metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "RAG School",
    template: "%s | RAG School",
  },
  description: "Sistema RAG con entrenamiento multimodal, recuperación semántica y respuestas asistidas por Groq.",
  keywords: ["RAG", "Supabase", "Groq", "Gemini", "semantic search", "knowledge base"],
  applicationName: "RAG School",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "RAG School",
    description: "Consulta y entrena una base de conocimiento multimodal con Supabase, Gemini y Groq.",
    type: "website",
    locale: "es_AR",
    images: [
      {
        url: "/branding/rag-school.png",
        width: 64,
        height: 64,
        alt: "RAG School",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "RAG School",
    description: "Consulta y entrena una base de conocimiento multimodal con Supabase, Gemini y Groq.",
    images: ["/branding/rag-school.png"],
  },
} satisfies Metadata

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className={`${mono.variable} ${sans.variable}`}>
      <body className="bg-shell">
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-50 rounded-full border border-[#2a2a3a] bg-[#111118] px-4 py-2 text-sm text-[#ececf7] focus:not-sr-only"
        >
          Saltar al contenido
        </a>
        <img
          src="/branding/rag-school.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none fixed bottom-10 left-10 z-0 hidden w-16 select-none lg:block"
        />
        {children}
      </body>
    </html>
  )
}
