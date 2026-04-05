export interface MatchDocument {
  id?: number | string
  content: string
  metadata?: Record<string, unknown> | null
  similarity?: number | null
}
