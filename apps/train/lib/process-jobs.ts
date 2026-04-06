export type ProcessJobStatus = "pending" | "processing" | "completed" | "failed"

export type ProcessJob = {
  id: string
  status: ProcessJobStatus
  filePath: string
  profileId: string
  result?: unknown
  error?: string
  createdAt: string
  updatedAt: string
}

const jobs = new Map<string, ProcessJob>()

export function createProcessJob(input: { filePath: string; profileId: string }): ProcessJob {
  const now = new Date().toISOString()
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

  const job: ProcessJob = {
    id,
    status: "pending",
    filePath: input.filePath,
    profileId: input.profileId,
    createdAt: now,
    updatedAt: now,
  }

  jobs.set(id, job)
  return job
}

export function getProcessJob(jobId: string): ProcessJob | undefined {
  return jobs.get(jobId)
}

export function listProcessJobs(): ProcessJob[] {
  return Array.from(jobs.values())
}

export function touchProcessJob(job: ProcessJob): void {
  job.updatedAt = new Date().toISOString()
}
