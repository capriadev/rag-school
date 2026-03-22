import React, { useRef, useState } from "react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"

export default function App() {
  const [trainText, setTrainText] = useState("")
  const fileRef = useRef(null)
  const [trainingStatus, setTrainingStatus] = useState(null)

  const [question, setQuestion] = useState("")
  const [responseData, setResponseData] = useState(null)
  const [streamingText, setStreamingText] = useState("")
  const [consultStatus, setConsultStatus] = useState(null)

  async function handleTrain(e) {
    e.preventDefault()
    setTrainingStatus("processing")

    const form = new FormData()
    form.append("text", trainText)
    const file = fileRef.current?.files?.[0]
    if (file) form.append("file", file)

    try {
      const res = await fetch(`${API_BASE_URL}/api/train`, {
        method: "POST",
        body: form,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Error al entrenar")
      }

      const json = await res.json()
      setResponseData(json)
      setTrainingStatus("success")
    } catch (err) {
      console.error(err)
      setTrainingStatus("error")
      setResponseData({ error: err.message })
    }
  }

  async function handleConsult(e) {
    e.preventDefault()
    setResponseData(null)
    setStreamingText("")
    setConsultStatus("processing")

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Error al consultar")
      }

      const ct = res.headers.get("content-type") || ""

      if (ct.includes("text/event-stream") || ct.includes("event-stream")) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let done = false

        while (!done) {
          const { value, done: d } = await reader.read()
          done = d

          if (value) {
            const chunk = decoder.decode(value)
            setStreamingText((s) => s + chunk)
          }
        }

        setConsultStatus("done")
      } else {
        const text = await res.text()

        try {
          const json = JSON.parse(text)
          setResponseData(json)
        } catch {
          setResponseData({ text })
        }

        setConsultStatus("done")
      }
    } catch (err) {
      console.error(err)
      setConsultStatus("error")
      setResponseData({ error: err.message })
    }
  }

  return (
    <div className="app-root">
      <header>
        <h1>RAG School - Cliente</h1>
      </header>

      <main>
        <section className="panel">
          <h2>Entrenamiento</h2>
          <form onSubmit={handleTrain} className="form">
            <label>
              Texto:
              <input
                type="text"
                value={trainText}
                onChange={(e) => setTrainText(e.target.value)}
                placeholder="Ingresa texto para entrenar"
              />
            </label>

            <label>
              Archivo (PDF):
              <input type="file" ref={fileRef} accept=".pdf,application/pdf" />
            </label>

            <div className="actions">
              <button type="submit">Enviar a /api/train</button>
              {trainingStatus === "processing" && <span className="status">Procesando...</span>}
              {trainingStatus === "success" && <span className="status success">Exito</span>}
              {trainingStatus === "error" && <span className="status error">Error</span>}
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Consulta</h2>
          <form onSubmit={handleConsult} className="form">
            <label>
              Pregunta:
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Haz una pregunta..."
              />
            </label>

            <div className="actions">
              <button type="submit">Enviar a /api/query</button>
              {consultStatus === "processing" && <span className="status">Procesando...</span>}
              {consultStatus === "error" && <span className="status error">Error</span>}
            </div>
          </form>

          <div className="response">
            <h3>Respuesta</h3>
            {consultStatus === "processing" && streamingText && (
              <pre className="stream">{streamingText}</pre>
            )}

            {responseData && (
              <pre className="json">{JSON.stringify(responseData, null, 2)}</pre>
            )}

            {consultStatus === "done" && !responseData && streamingText && (
              <pre className="stream">{streamingText}</pre>
            )}
          </div>
        </section>
      </main>

      <footer>Backend local en {API_BASE_URL}</footer>
    </div>
  )
}
