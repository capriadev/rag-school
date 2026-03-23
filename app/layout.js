import "./globals.css"

export const metadata = {
  title: "RAG School",
  description: "Next migration in progress",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
