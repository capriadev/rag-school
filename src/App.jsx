import React, { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3101"
const TRAIN_ACCEPT = ".pdf,.ppt,.pptx,.xls,.xlsx,.csv,image/*,video/*,audio/*"

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  return pathname
}

function StatusBadge({ status }) {
  if (!status) return null

  const labels = {
    processing: "Procesando",
    success: "Exito",
    error: "Error",
    done: "Listo",
  }

  return <span className={`status-pill ${status}`}>{labels[status] || status}</span>
}

function QueryPage({ question, setQuestion, handleConsult, consultStatus, responseData, streamingText }) {
  const previewMatches = useMemo(() => responseData?.matches || [], [responseData])

  return (
    <div className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Consulta semantica</p>
          <h1>Explora la base de conocimiento.</h1>
          <p className="hero-text">
            Recupera contexto relevante y genera respuestas sobre el material ya incorporado al
            sistema.
          </p>
        </div>
        <div className="hero-meta">
          <div className="meta-card">
            <span>Proveedor embeddings</span>
            <strong>Gemini</strong>
          </div>
          <div className="meta-card">
            <span>Proveedor respuesta</span>
            <strong>Groq</strong>
          </div>
          <div className="meta-card">
            <span>Vector store</span>
            <strong>Supabase</strong>
          </div>
        </div>
      </section>

      <section className="query-panel">
        <div className="section-head">
          <div>
            <p className="section-label">Consulta</p>
            <h2>Buscar respuesta</h2>
          </div>
          <StatusBadge status={consultStatus} />
        </div>

        <form className="query-form" onSubmit={handleConsult}>
          <label className="field">
            <span>Pregunta</span>
            <textarea
              rows="4"
              maxLength="700"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escribe una consulta con el mayor contexto posible para obtener mejores resultados."
            />
            <small className="field-help">{question.length}/700</small>
          </label>

          <button className="primary-button" type="submit">
            Consultar
          </button>
        </form>

        <div className="inline-fragments">
          <div className="section-head compact">
            <div>
              <p className="section-label">Recuperacion</p>
              <h3>Fragmentos relevantes</h3>
            </div>
            <span className="counter">{previewMatches.length}</span>
          </div>

          {previewMatches.length ? (
            <div className="match-list compact-list">
              {previewMatches.map((match, index) => (
                <div className="match-item compact-item" key={`${match.id || "match"}-${index}`}>
                  <div className="match-meta">
                    <span>Fragmento {index + 1}</span>
                    <strong>
                      {typeof match.similarity === "number"
                        ? `${(match.similarity * 100).toFixed(1)}%`
                        : "N/A"}
                    </strong>
                  </div>
                  <p>{match.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-copy">
              Los fragmentos recuperados apareceran aca junto al formulario de consulta.
            </p>
          )}
        </div>
      </section>

      <section className="result-card answer-card wide-card">
        <div className="section-head compact">
          <div>
            <p className="section-label">Salida</p>
            <h3>Respuesta</h3>
          </div>
        </div>

        {consultStatus === "processing" && streamingText ? (
          <pre className="response-block accent">{streamingText}</pre>
        ) : null}

        {responseData?.answer ? (
          <div className="answer-body markdown-body">
            <ReactMarkdown>{responseData.answer}</ReactMarkdown>
          </div>
        ) : null}

        {responseData?.error ? (
          <pre className="response-block error">{responseData.error}</pre>
        ) : null}

        {!responseData && !streamingText ? (
          <p className="empty-copy">
            La respuesta final se renderiza en markdown para que listas, enfasis y estructura se
            vean bien.
          </p>
        ) : null}
      </section>
    </div>
  )
}

function TrainPage({
  trainText,
  setTrainText,
  handleTrain,
  trainingStatus,
  responseData,
  fileRef,
  selectedFileName,
}) {
  return (
    <div className="page-shell">
      <section className="hero training-hero">
        <div className="hero-copy">
          <p className="eyebrow">Entrenamiento</p>
          <h1>Incorpora nuevas fuentes.</h1>
          <p className="hero-text">
            Carga texto o documentos para ampliar la base de conocimiento y mantener el sistema
            actualizado.
          </p>
        </div>
        <div className="support-grid">
          <span>Texto</span>
          <span>Imagenes</span>
          <span>Video</span>
          <span>Audio</span>
          <span>PDF</span>
          <span>PPTX</span>
          <span>Excel</span>
        </div>
      </section>

      <section className="query-panel training-panel">
        <div className="section-head">
          <div>
            <p className="section-label">Carga</p>
            <h2>Agregar conocimiento</h2>
          </div>
          <StatusBadge status={trainingStatus} />
        </div>

        <form className="training-form" onSubmit={handleTrain}>
          <label className="field">
            <span>Texto</span>
            <textarea
              rows="10"
              value={trainText}
              onChange={(e) => setTrainText(e.target.value)}
              placeholder="Pega contenido textual, notas, instrucciones o resumenes."
            />
          </label>

          <label className="upload-zone">
            <span className="upload-title">Archivos</span>
            <strong>Arrastra o selecciona material para entrenar</strong>
            <small>
              Preparado visualmente para PDF, imagenes, video, audio, PPTX y Excel. La ingestión
              binaria activa del backend sigue limitada a PDF en esta etapa.
            </small>
            <span className="upload-chip-row">
              <span className="upload-chip">PDF</span>
              <span className="upload-chip">Imagenes</span>
              <span className="upload-chip">Video</span>
              <span className="upload-chip">Audio</span>
              <span className="upload-chip">PPTX</span>
              <span className="upload-chip">Excel</span>
            </span>
            <span className="file-trigger">Seleccionar archivo</span>
            <input ref={fileRef} type="file" accept={TRAIN_ACCEPT} />
            <span className="file-name">{selectedFileName || "Ningun archivo seleccionado"}</span>
          </label>

          <button className="primary-button" type="submit">
            Entrenar
          </button>
        </form>
      </section>

      <section className="result-card wide-card">
        <div className="section-head compact">
          <div>
            <p className="section-label">Resultado</p>
            <h3>Respuesta del backend</h3>
          </div>
        </div>

        {responseData ? (
          <pre className="response-block">{JSON.stringify(responseData, null, 2)}</pre>
        ) : (
          <p className="empty-copy">
            El backend devuelve aca el detalle de chunks e inserciones para validar el pipeline.
          </p>
        )}
      </section>
    </div>
  )
}

export default function App() {
  const pathname = usePathname()
  const isTrainingRoute = pathname === "/train"
  const fileRef = useRef(null)

  const [trainText, setTrainText] = useState("")
  const [trainingStatus, setTrainingStatus] = useState(null)

  const [question, setQuestion] = useState("")
  const [responseData, setResponseData] = useState(null)
  const [streamingText, setStreamingText] = useState("")
  const [consultStatus, setConsultStatus] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState("")

  async function handleTrain(e) {
    e.preventDefault()
    setTrainingStatus("processing")
    setResponseData(null)

    const form = new FormData()
    form.append("text", trainText)
    const file = fileRef.current?.files?.[0]
    if (file) form.append("file", file)

    try {
      const res = await fetch(`${API_BASE_URL}/api/train`, {
        method: "POST",
        body: form,
      })

      const text = await res.text()
      const payload = text ? JSON.parse(text) : null

      if (!res.ok) {
        throw new Error(payload?.error || "Error al entrenar")
      }

      setResponseData(payload)
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

      const text = await res.text()

      try {
        const json = JSON.parse(text)
        setResponseData(json)
      } catch {
        setResponseData({ text })
      }

      setConsultStatus("done")
    } catch (err) {
      console.error(err)
      setConsultStatus("error")
      setResponseData({ error: err.message })
    }
  }

  useEffect(() => {
    const input = fileRef.current
    if (!input) return undefined

    const handleChange = () => {
      setSelectedFileName(input.files?.[0]?.name || "")
    }

    input.addEventListener("change", handleChange)
    return () => input.removeEventListener("change", handleChange)
  }, [isTrainingRoute])

  return (
    <div className="app-shell">
      <div className="grid-overlay" />
      <header className="site-header">
        <a className="logo" href="/">
          RAG <span>School</span>
          <em>core</em>
        </a>
        <div className="header-badge">
          <span className="badge-dot" />
          <span>{isTrainingRoute ? "Training" : "Query"}</span>
        </div>
      </header>

      {isTrainingRoute ? (
        <TrainPage
          trainText={trainText}
          setTrainText={setTrainText}
          handleTrain={handleTrain}
          trainingStatus={trainingStatus}
          responseData={responseData}
          fileRef={fileRef}
          selectedFileName={selectedFileName}
        />
      ) : (
        <QueryPage
          question={question}
          setQuestion={setQuestion}
          handleConsult={handleConsult}
          consultStatus={consultStatus}
          responseData={responseData}
          streamingText={streamingText}
        />
      )}
    </div>
  )
}
