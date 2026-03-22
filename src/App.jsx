import React, { useState, useRef } from "react"

export default function App() {
  const [trainText, setTrainText] = useState("")
  const fileRef = useRef(null)
  const [trainingStatus, setTrainingStatus] = useState(null) // null | "processing" | "success" | "error"

  const [question, setQuestion] = useState("")
  const [responseData, setResponseData] = useState(null)
  const [streamingText, setStreamingText] = useState("")
  const [consultStatus, setConsultStatus] = useState(null) // null | "processing" | "done" | "error"

  async function handleTrain(e) {
    e.preventDefault()
    setTrainingStatus("processing")

    const form = new FormData()
    form.append("text", trainText)
    const file = fileRef.current?.files?.[0]
    if (file) form.append("file", file)

    try {
      const res = await fetch("http://localhost:5678/webhook/entrenar", {
        method: "POST",
        body: form
      })

      if (!res.ok) throw new Error("Error en webhook")
      setTrainingStatus("success")
    } catch (err) {
      console.error(err)
      setTrainingStatus("error")
    }
  }

  async function handleConsult(e) {
    e.preventDefault()
    setResponseData(null)
    setStreamingText("")
    setConsultStatus("processing")

    try {
      const res = await fetch("http://localhost:5678/webhook/consultar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question })
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Error en webhook consultar")
      }

      const ct = res.headers.get("content-type") || ""

      if (ct.includes("text/event-stream") || ct.includes("event-stream")) {
        // streaming response: leer por stream
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
        // intentar JSON, si no, texto
        const text = await res.text()
        try {
          const json = JSON.parse(text)
          setResponseData(json)
        } catch (e) {
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
        <h1>RAG School — Cliente</h1>
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
              Archivo (PDF / imagen / video):
              <input type="file" ref={fileRef} accept=".pdf,image/*,video/*" />
            </label>

            <div className="actions">
              <button type="submit">Enviar a /entrenar</button>
              {trainingStatus === "processing" && <span className="status">Procesando...</span>}
              {trainingStatus === "success" && <span className="status success">Éxito</span>}
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
              <button type="submit">Enviar a /consultar</button>
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

      <footer>Conecta n8n en http://localhost:5678/webhook-test/entrenar y /consultar</footer>
    </div>
  )
}
