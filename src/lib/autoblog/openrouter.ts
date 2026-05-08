import { AUTOBLOG } from "./config"

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

export type ChatRequest = {
  model: string
  messages: ChatMessage[]
  max_tokens?: number
  temperature?: number
  response_format?: { type: "json_object" }
}

export type ChatResponse = {
  id?: string
  model?: string
  choices?: Array<{
    message?: { content?: string | null }
    finish_reason?: string
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    cost?: number
  }
  error?: { message?: string; code?: number }
}

export async function callChat(
  req: ChatRequest,
  timeoutMs = 120_000
): Promise<ChatResponse> {
  if (!AUTOBLOG.apiKey) throw new Error("OPENROUTER_API_KEY not configured")
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AUTOBLOG.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": AUTOBLOG.siteUrl,
        "X-Title": AUTOBLOG.appName,
      },
      body: JSON.stringify(req),
      signal: ctrl.signal,
    })
    const body = (await res.json().catch(() => ({}))) as ChatResponse
    if (!res.ok) {
      throw new Error(
        `OpenRouter ${res.status}: ${body.error?.message ?? "request failed"}`
      )
    }
    return body
  } finally {
    clearTimeout(timer)
  }
}

export function extractText(resp: ChatResponse): string {
  return resp.choices?.[0]?.message?.content?.trim() ?? ""
}
