"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { CHUNK_OPTIONS, DEFAULT_CHUNK_COUNT } from "../lib/shared/llm"
import type { ChangeEvent, FormEvent, MutableRefObject } from "react"
import type { QueryResponse, Status, TrainMetricsResponse, TrainResponse, VectorStoreMetrics } from "../lib/shared/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""
const TRAIN_ACCEPT = ".pdf,.pptx,.xls,.xlsx,.ods,.csv,image/*,video/*,audio/*"

interface StatusBadgeProps {
  status: Status
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null

  const labels = {
    processing: "Procesando",
    success: "Exito",
    error: "Error",
    done: "Listo",
  }

  return <span className={`status-pill ${status}`}>{labels[status] || status}</span>
}

interface QueryPageProps {
  question: string
  setQuestion: (value: string) => void
  chunkCount: number
  setChunkCount: (value: number) => void
  handleConsult: (event: FormEvent<HTMLFormElement>) => Promise<void>
  consultStatus: Status
  responseData: QueryResponse | null
  streamingText: string
}

function QueryPage({
  question,
  setQuestion,
  chunkCount,
  setChunkCount,
  handleConsult,
  consultStatus,
  responseData,
  streamingText,
}: QueryPageProps) {
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
            La respuesta final se renderiza en markdown para que listas, enfasis y estructura se vean bien.
          </p>
        ) : null}
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
              rows={4}
              maxLength={700}
              value={question}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setQuestion(event.target.value)}
              placeholder="Escribe una consulta con el mayor contexto posible para obtener mejores resultados."
            />
            <small className="field-help">{question.length}/700</small>
          </label>

          <div className="query-actions">
            <label className="field field-inline">
              <span>Fragmentos a recuperar</span>
              <select
                value={chunkCount}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setChunkCount(Number(event.target.value))
                }
              >
                {CHUNK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <small className="field-help field-help-left">
                La cantidad elegida ajusta recuperacion y modelo de respuesta.
              </small>
            </label>

            <button className="primary-button" type="submit">
              Consultar
            </button>
          </div>
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
    </div>
  )
}

interface TrainPageProps {
  trainText: string
  setTrainText: (value: string) => void
  handleTrain: (event: FormEvent<HTMLFormElement>) => Promise<void>
  trainingStatus: Status
  responseData: TrainResponse | QueryResponse | null
  metrics: VectorStoreMetrics | null
  metricsStatus: Status
  handleDownloadSnapshot: () => Promise<void>
  fileRef: MutableRefObject<HTMLInputElement | null>
  selectedFileName: string
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function TrainPage({
  trainText,
  setTrainText,
  handleTrain,
  trainingStatus,
  responseData,
  metrics,
  metricsStatus,
  handleDownloadSnapshot,
  fileRef,
  selectedFileName,
}: TrainPageProps) {
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
          <span>CSV</span>
        </div>
      </section>

      <section className="result-card metrics-card">
        <div className="section-head compact">
          <div>
            <p className="section-label">Metricas</p>
            <h3>Estado del vector store</h3>
          </div>
          <StatusBadge status={metricsStatus} />
        </div>

        <div className="metrics-grid">
          <div className="metric-box">
            <span>Espacio estimado</span>
            <strong>{metrics ? formatMegabytes(metrics.estimatedStorageBytes) : "--"}</strong>
          </div>
          <div className="metric-box">
            <span>Chunks guardados</span>
            <strong>{metrics?.totalChunks ?? "--"}</strong>
          </div>
          <div className="metric-box">
            <span>Fuentes unicas</span>
            <strong>{metrics?.uniqueSources ?? "--"}</strong>
          </div>
        </div>

        <div className="metrics-footer">
          <div className="metrics-breakdown">
            <span className="section-label">Tipos</span>
            <div className="upload-chip-row">
              {metrics && Object.keys(metrics.sourceTypes).length ? (
                Object.entries(metrics.sourceTypes).map(([sourceType, count]) => (
                  <span className="upload-chip" key={sourceType}>
                    {sourceType}: {count}
                  </span>
                ))
              ) : (
                <span className="upload-chip">Sin datos</span>
              )}
            </div>
          </div>

          <button className="secondary-button" type="button" onClick={handleDownloadSnapshot}>
            Descargar snapshot
          </button>
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
              rows={10}
              value={trainText}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setTrainText(event.target.value)}
              placeholder="Pega contenido textual, notas, instrucciones o resumenes."
            />
          </label>

          <label className="upload-zone">
            <span className="upload-title">Archivos</span>
            <strong>Arrastra o selecciona material para entrenar</strong>
            <small>
              El backend ya procesa texto, PDF, imagenes, audio, video, PPTX, CSV y Excel. En
              multimedia, Gemini extrae texto o contexto util para indexacion.
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

interface RagShellProps {
  mode: "query" | "train"
}

function parseResponsePayload<T>(text: string): T | null {
  return text ? (JSON.parse(text) as T) : null
}

export function RagShell({ mode }: RagShellProps) {
  const isTrainingRoute = mode === "train"
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [trainText, setTrainText] = useState("")
  const [trainingStatus, setTrainingStatus] = useState<Status>(null)
  const [question, setQuestion] = useState("")
  const [chunkCount, setChunkCount] = useState(DEFAULT_CHUNK_COUNT)
  const [responseData, setResponseData] = useState<QueryResponse | TrainResponse | null>(null)
  const [streamingText, setStreamingText] = useState("")
  const [consultStatus, setConsultStatus] = useState<Status>(null)
  const [selectedFileName, setSelectedFileName] = useState("")
  const [metrics, setMetrics] = useState<VectorStoreMetrics | null>(null)
  const [metricsStatus, setMetricsStatus] = useState<Status>(null)

  async function loadTrainMetrics() {
    setMetricsStatus("processing")

    try {
      const response = await fetch(`${API_BASE_URL}/api/train/metrics`)
      const text = await response.text()
      const payload = parseResponsePayload<TrainMetricsResponse>(text)

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudieron cargar las metricas")
      }

      setMetrics(payload?.metrics || null)
      setMetricsStatus("success")
    } catch (error) {
      console.error(error)
      setMetricsStatus("error")
    }
  }

  async function handleDownloadSnapshot() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/train/export`)

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "No se pudo descargar el snapshot")
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      const disposition = response.headers.get("Content-Disposition") || ""
      const fileNameMatch = disposition.match(/filename="(.+)"/)

      anchor.href = downloadUrl
      anchor.download = fileNameMatch?.[1] || "vector-store.json"
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error(error)
      setResponseData({
        error: error instanceof Error ? error.message : "No se pudo descargar el snapshot",
      })
    }
  }

  async function handleTrain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
      const payload = parseResponsePayload<TrainResponse>(text)

      if (!res.ok) {
        throw new Error(payload?.error || "Error al entrenar")
      }

      setResponseData(payload)
      setTrainingStatus("success")
      void loadTrainMetrics()
    } catch (err) {
      console.error(err)
      setTrainingStatus("error")
      setResponseData({
        error: err instanceof Error ? err.message : "Error al entrenar",
      })
    }
  }

  async function handleConsult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResponseData(null)
    setStreamingText("")
    setConsultStatus("processing")

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, chunkCount }),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Error al consultar")
      }

      const text = await res.text()

      try {
        const json = parseResponsePayload<QueryResponse>(text)
        setResponseData(json)
      } catch {
        setResponseData({ text })
      }

      setConsultStatus("done")
    } catch (err) {
      console.error(err)
      setConsultStatus("error")
      setResponseData({
        error: err instanceof Error ? err.message : "Error al consultar",
      })
    }
  }

  useEffect(() => {
    if (!isTrainingRoute) {
      return undefined
    }

    void loadTrainMetrics()

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
          metrics={metrics}
          metricsStatus={metricsStatus}
          handleDownloadSnapshot={handleDownloadSnapshot}
          fileRef={fileRef}
          selectedFileName={selectedFileName}
        />
      ) : (
        <QueryPage
          question={question}
          setQuestion={setQuestion}
          chunkCount={chunkCount}
          setChunkCount={setChunkCount}
          handleConsult={handleConsult}
          consultStatus={consultStatus}
          responseData={responseData}
          streamingText={streamingText}
        />
      )}
    </div>
  )
}
