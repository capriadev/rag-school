"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { CHUNK_OPTIONS, DEFAULT_CHUNK_COUNT } from "../lib/shared/llm"
import type { ChangeEvent, FormEvent, MutableRefObject } from "react"
import type { QueryResponse, Status, TrainMetricsResponse, TrainResponse, VectorStoreMetrics } from "../lib/shared/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""
const TRAIN_ACCEPT = ".pdf,.pptx,.xls,.xlsx,.ods,.csv,image/*,video/*,audio/*"

function panelClass(extra = "") {
  return `panel p-7 md:p-8 ${extra}`.trim()
}

function sectionTitle(label: string, title: string) {
  return (
    <div>
      <p className="section-kicker">{label}</p>
      <h2 className="font-sans text-[1.7rem] tracking-[-0.5px] text-[#ececf7]">{title}</h2>
    </div>
  )
}

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

  const tones: Record<Exclude<Status, null>, string> = {
    processing: "border-[rgba(0,229,176,0.3)] text-[#00e5b0]",
    success: "border-[rgba(0,229,176,0.3)] text-[#00e5b0]",
    error: "border-[rgba(255,76,107,0.3)] text-[#ff4c6b]",
    done: "border-[rgba(0,229,176,0.3)] text-[#00e5b0]",
  }

  return <span className={`pill ${tones[status]}`}>{labels[status] || status}</span>
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
    <div className="relative z-[1] mx-auto flex max-w-[1160px] flex-col gap-6">
      <section className={`${panelClass()} grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]`}>
        <div>
          <p className="section-kicker">Consulta semantica</p>
          <h1 className="mb-4 font-sans text-[clamp(2.4rem,6vw,4rem)] font-extrabold leading-[0.95] tracking-[-2px]">
            Explora la base de conocimiento.
          </h1>
          <p className="max-w-[60ch] leading-8 text-[#8e8ea9]">
            Recupera contexto relevante y genera respuestas sobre el material ya incorporado al sistema.
          </p>
        </div>

        <div className="grid gap-3">
          {[
            ["Proveedor embeddings", "Gemini"],
            ["Proveedor respuesta", "Groq"],
            ["Vector store", "Supabase"],
          ].map(([label, value]) => (
            <div
              className="rounded-[18px] border border-[#2a2a3a] bg-[rgba(255,255,255,0.02)] px-[18px] py-4"
              key={label}
            >
              <span className="mb-2 block text-[11px] uppercase tracking-[1.4px] text-[#55556f]">{label}</span>
              <strong className="font-sans text-2xl font-bold">{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className={`${panelClass("min-h-[320px]")}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Salida</p>
            <h3 className="font-sans text-[1.35rem] tracking-[-0.5px]">Respuesta</h3>
          </div>
        </div>

        {consultStatus === "processing" && streamingText ? (
          <pre className="overflow-auto rounded-[18px] border border-[#2a2a3a] bg-[#111118] p-[18px] text-[#00e5b0]">
            {streamingText}
          </pre>
        ) : null}

        {responseData?.answer ? (
          <div className="prose prose-invert max-w-none rounded-[18px] border border-[#2a2a3a] bg-[#111118] p-[18px] prose-p:leading-8 prose-strong:text-white">
            <ReactMarkdown>{responseData.answer}</ReactMarkdown>
          </div>
        ) : null}

        {responseData?.error ? (
          <pre className="overflow-auto rounded-[18px] border border-[#2a2a3a] bg-[#111118] p-[18px] text-[#ff4c6b]">
            {responseData.error}
          </pre>
        ) : null}

        {!responseData && !streamingText ? (
          <p className="max-w-[60ch] leading-8 text-[#8e8ea9]">
            La respuesta final se renderiza en markdown para que listas, enfasis y estructura se vean bien.
          </p>
        ) : null}
      </section>

      <section className={panelClass()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          {sectionTitle("Consulta", "Buscar respuesta")}
          <StatusBadge status={consultStatus} />
        </div>

        <form className="flex flex-col gap-[18px]" onSubmit={handleConsult}>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[1.5px] text-[#8e8ea9]">Pregunta</span>
            <textarea
              rows={4}
              maxLength={700}
              value={question}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setQuestion(event.target.value)}
              placeholder="Escribe una consulta con el mayor contexto posible para obtener mejores resultados."
              className="form-control min-h-[140px] leading-[1.7]"
            />
            <small className="text-right text-[11px] text-[#55556f]">{question.length}/700</small>
          </label>

          <div className="flex flex-col gap-[18px] md:flex-row md:items-end md:justify-between">
            <label className="flex min-w-0 flex-col gap-2 md:min-w-[240px] md:max-w-[320px]">
              <span className="text-[11px] uppercase tracking-[1.5px] text-[#8e8ea9]">Fragmentos a recuperar</span>
              <select
                value={chunkCount}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setChunkCount(Number(event.target.value))}
                className="form-control min-h-[60px] cursor-pointer appearance-none"
              >
                {CHUNK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <small className="text-left text-[11px] text-[#55556f]">
                La cantidad elegida ajusta recuperacion y modelo de respuesta.
              </small>
            </label>

            <button
              className="w-full min-w-[180px] rounded-full bg-gradient-to-br from-[#5b4cff] to-[#7a6cff] px-6 py-4 font-sans text-base font-bold text-white shadow-[0_18px_40px_rgba(91,76,255,0.3)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(91,76,255,0.36)] md:w-auto"
              type="submit"
            >
              Consultar
            </button>
          </div>
        </form>

        <div className="mt-7 border-t border-[#2a2a3a] pt-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Recuperacion</p>
              <h3 className="font-sans text-[1.35rem] tracking-[-0.5px]">Fragmentos relevantes</h3>
            </div>
            <span className="pill">{previewMatches.length}</span>
          </div>

          {previewMatches.length ? (
            <div className="flex max-h-[360px] flex-col gap-[14px] overflow-auto pr-[6px]">
              {previewMatches.map((match, index) => (
                <div className="rounded-[18px] border border-[#2a2a3a] bg-[#111118] p-4" key={`${match.id || "match"}-${index}`}>
                  <div className="mb-2.5 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[1.5px] text-[#55556f]">
                    <span>Fragmento {index + 1}</span>
                    <strong className="text-[#00e5b0]">
                      {typeof match.similarity === "number" ? `${(match.similarity * 100).toFixed(1)}%` : "N/A"}
                    </strong>
                  </div>
                  <p className="m-0 text-[0.92rem] leading-7 text-[#8e8ea9]">{match.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="max-w-[60ch] leading-8 text-[#8e8ea9]">
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
    <div className="relative z-[1] mx-auto flex max-w-[1160px] flex-col gap-6">
      <section className={`${panelClass()} grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]`}>
        <div>
          <p className="section-kicker">Entrenamiento</p>
          <h1 className="mb-4 font-sans text-[clamp(2.4rem,6vw,4rem)] font-extrabold leading-[0.95] tracking-[-2px]">
            Incorpora nuevas fuentes.
          </h1>
          <p className="max-w-[60ch] leading-8 text-[#8e8ea9]">
            Carga texto o documentos para ampliar la base de conocimiento y mantener el sistema actualizado.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {["Texto", "Imagenes", "Video", "Audio", "PDF", "PPTX", "Excel", "CSV"].map((item) => (
            <span
              className="rounded-[18px] border border-[#2a2a3a] bg-[rgba(255,255,255,0.02)] px-[18px] py-4 font-sans text-[1.1rem] font-bold"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className={`${panelClass()} flex min-h-[320px] flex-col gap-5`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Metricas</p>
            <h3 className="font-sans text-[1.35rem] tracking-[-0.5px]">Estado del vector store</h3>
          </div>
          <StatusBadge status={metricsStatus} />
        </div>

        <div className="grid gap-[14px] lg:grid-cols-3">
          {[
            ["Espacio estimado", metrics ? formatMegabytes(metrics.estimatedStorageBytes) : "--"],
            ["Chunks guardados", metrics?.totalChunks ?? "--"],
            ["Fuentes unicas", metrics?.uniqueSources ?? "--"],
          ].map(([label, value]) => (
            <div className="rounded-[18px] border border-[#2a2a3a] bg-[#111118] p-[18px]" key={label}>
              <span className="mb-2.5 block text-[11px] uppercase tracking-[1.4px] text-[#55556f]">{label}</span>
              <strong className="font-sans text-2xl font-bold">{value}</strong>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[18px] lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <span className="section-kicker mb-0">Tipos</span>
            <div className="flex flex-wrap gap-[10px]">
              {metrics && Object.keys(metrics.sourceTypes).length ? (
                Object.entries(metrics.sourceTypes).map(([sourceType, count]) => (
                  <span className="rounded-full border border-[#2a2a3a] px-3 py-2 text-[11px] uppercase tracking-[1px] text-[#8e8ea9]" key={sourceType}>
                    {sourceType}: {count}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-[#2a2a3a] px-3 py-2 text-[11px] uppercase tracking-[1px] text-[#8e8ea9]">
                  Sin datos
                </span>
              )}
            </div>
          </div>

          <button
            className="w-full min-w-[180px] rounded-full border border-[#2a2a3a] bg-[rgba(255,255,255,0.03)] px-[22px] py-[14px] font-sans text-[0.98rem] font-bold text-[#ececf7] transition duration-200 hover:-translate-y-0.5 hover:border-[#5b4cff] hover:bg-[rgba(91,76,255,0.08)] lg:w-auto"
            type="button"
            onClick={handleDownloadSnapshot}
          >
            Descargar snapshot
          </button>
        </div>
      </section>

      <section className={panelClass()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          {sectionTitle("Carga", "Agregar conocimiento")}
          <StatusBadge status={trainingStatus} />
        </div>

        <form className="flex flex-col gap-[18px]" onSubmit={handleTrain}>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[1.5px] text-[#8e8ea9]">Texto</span>
            <textarea
              rows={10}
              value={trainText}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setTrainText(event.target.value)}
              placeholder="Pega contenido textual, notas, instrucciones o resumenes."
              className="form-control min-h-[220px] leading-[1.7]"
            />
          </label>

          <label className="relative flex w-full flex-col gap-[14px] rounded-[18px] border border-dashed border-[#2a2a3a] bg-[#111118] p-7 transition duration-200 hover:border-[#5b4cff] hover:bg-[rgba(91,76,255,0.05)]">
            <span className="text-[11px] uppercase tracking-[1.5px] text-[#55556f]">Archivos</span>
            <strong className="font-sans text-2xl leading-[1.1]">Arrastra o selecciona material para entrenar</strong>
            <small className="max-w-[52ch] leading-7 text-[#8e8ea9]">
              El backend ya procesa texto, PDF, imagenes, audio, video, PPTX, CSV y Excel. En multimedia,
              Gemini extrae texto o contexto util para indexacion.
            </small>
            <span className="flex flex-wrap gap-[10px]">
              {["PDF", "Imagenes", "Video", "Audio", "PPTX", "Excel", "CSV"].map((item) => (
                <span
                  className="rounded-full border border-[#2a2a3a] px-3 py-2 text-[11px] uppercase tracking-[1px] text-[#8e8ea9]"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </span>
            <span className="w-fit rounded-full bg-[rgba(91,76,255,0.14)] px-4 py-3 font-sans font-bold text-[#ececf7]">
              Seleccionar archivo
            </span>
            <input className="absolute inset-0 cursor-pointer opacity-0" ref={fileRef} type="file" accept={TRAIN_ACCEPT} />
            <span className="text-xs leading-6 text-[#00e5b0]">{selectedFileName || "Ningun archivo seleccionado"}</span>
          </label>

          <button
            className="w-full min-w-[180px] rounded-full bg-gradient-to-br from-[#5b4cff] to-[#7a6cff] px-6 py-4 font-sans text-base font-bold text-white shadow-[0_18px_40px_rgba(91,76,255,0.3)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(91,76,255,0.36)] md:w-fit"
            type="submit"
          >
            Entrenar
          </button>
        </form>
      </section>

      <section className={`${panelClass("min-h-[320px]")}`}>
        <div className="mb-5">
          <p className="section-kicker">Resultado</p>
          <h3 className="font-sans text-[1.35rem] tracking-[-0.5px]">Respuesta del backend</h3>
        </div>

        {responseData ? (
          <pre className="overflow-auto rounded-[18px] border border-[#2a2a3a] bg-[#111118] p-[18px]">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        ) : (
          <p className="max-w-[60ch] leading-8 text-[#8e8ea9]">
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
    <div className="relative min-h-screen px-6 pb-20 pt-8 md:px-6">
      <div className="bg-grid pointer-events-none fixed inset-0 z-0" />

      <header className="relative z-[1] mx-auto mb-10 flex max-w-[1160px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <a className="font-sans text-[32px] font-extrabold tracking-[-1px]" href="/">
          RAG <span className="text-[#5b4cff]">School</span>
          <em className="ml-1.5 align-super text-[11px] not-italic uppercase tracking-[2px] text-[#00e5b0]">core</em>
        </a>

        <div className="inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[1.2px] text-[#8e8ea9]">
          <span className="h-2 w-2 rounded-full bg-[#00e5b0] shadow-[0_0_18px_rgba(0,229,176,0.7)]" />
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
