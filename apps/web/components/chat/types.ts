export type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export type ProfileOption = {
  id_profile: number
  name: string
  description: string | null
}
