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
  title: "RAG School",
  description: "Next migration in progress",
} satisfies Metadata

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className={`${mono.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
