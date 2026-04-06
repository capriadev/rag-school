export function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function asPositiveInt(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const parsed = Number.parseInt(String(value), 10)
  if (Number.isNaN(parsed) || parsed <= 0) return null
  return parsed
}
