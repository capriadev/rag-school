import "./globals.css"
import { IBM_Plex_Mono, Syne } from "next/font/google"

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
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${mono.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
