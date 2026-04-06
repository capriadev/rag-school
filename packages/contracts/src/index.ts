export interface ApiErrorShape {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiErrorShape
}

export interface ProfileDto {
  id_profile: number
  name: string
  description: string | null
  active: boolean
  doc_count?: number
}

export interface ProfilesListResponse {
  success: boolean
  profiles?: ProfileDto[]
  error?: string
}

export interface QueryResponseDto {
  success: boolean
  answer?: string
  error?: string
}

export type ProcessJobStatus = "pending" | "processing" | "completed" | "failed"

export interface ProcessJobDto {
  id: string
  status: ProcessJobStatus
  profileId: string
  result?: unknown
  error?: string
  createdAt: string
  updatedAt: string
}
