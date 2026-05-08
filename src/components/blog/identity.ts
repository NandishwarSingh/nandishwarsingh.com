"use client"

const TOKEN_KEY = "nandi.identity.token"
const NAME_KEY = "nandi.identity.name"
const EMAIL_KEY = "nandi.identity.email"

let cachedHash: string | null = null

function randomToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${crypto.randomUUID()}-${crypto.randomUUID()}`
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export function getIdentityToken(): string {
  if (typeof window === "undefined") return ""
  let t = window.localStorage.getItem(TOKEN_KEY)
  if (!t) {
    t = randomToken()
    window.localStorage.setItem(TOKEN_KEY, t)
  }
  return t
}

/** Browser-side equivalent of the server's `hashIdentity`. */
export async function getIdentityHash(): Promise<string> {
  if (cachedHash) return cachedHash
  const t = getIdentityToken()
  const buf = new TextEncoder().encode(`identity|${t}`)
  const digest = await crypto.subtle.digest("SHA-256", buf)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  cachedHash = hex.slice(0, 24)
  return cachedHash
}

export function getStoredName(): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(NAME_KEY) ?? ""
}

export function setStoredName(name: string): void {
  window.localStorage.setItem(NAME_KEY, name)
}

export function getStoredEmail(): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(EMAIL_KEY) ?? ""
}

export function setStoredEmail(email: string): void {
  if (email) window.localStorage.setItem(EMAIL_KEY, email)
  else window.localStorage.removeItem(EMAIL_KEY)
}
