export type Status = "processing" | "success" | "error" | "done" | null

export interface ChunkOptions {
  chunkSize?: number
  chunkOverlap?: number
}

export interface SourceInput {
  sourceType:
    | "text"
    | "pdf"
    | "csv"
    | "spreadsheet"
    | "presentation"
    | "image"
    | "audio"
    | "video"
  sourceName: string
  content: string
}

export interface DocumentMetadata extends Record<string, unknown> {
  sourceType: string
  sourceName: string
  chunkIndex: number
}

export interface PreparedChunk {
  content: string
  metadata: DocumentMetadata
}

export interface InsertDocument extends PreparedChunk {
  embedding: number[]
}

export interface MatchDocument {
  id?: number | string
  content: string
  metadata?: Record<string, unknown> | null
  similarity?: number | null
}

export interface QueryResponse {
  success?: boolean
  answer?: string
  error?: string
  chunkCount?: number
  matches?: MatchDocument[]
  text?: string
}

export interface TrainResponse {
  success?: boolean
  inserted?: number
  chunks?: number
  sources?: number
  error?: string
}

export interface VectorStoreMetrics {
  estimatedStorageBytes: number
  totalChunks: number
  uniqueSources: number
  sourceTypes: Record<string, number>
}

export interface TrainMetricsResponse {
  success?: boolean
  metrics?: VectorStoreMetrics
  error?: string
}

export interface VectorDocumentRow {
  id: number | string
  content: string
  metadata?: Record<string, unknown> | null
  embedding?: unknown
}
