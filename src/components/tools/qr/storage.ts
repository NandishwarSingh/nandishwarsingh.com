"use client"

const KEY = "nandi.qr.owners"

type Store = Record<string, { ownerKey: string; title: string; createdAt: string }>

function read(): Store {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Store
  } catch {
    return {}
  }
}

function write(data: Store): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(data))
}

export const QR_STORE_EVENT = "nandi.qr.changed"

function emitChange(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(QR_STORE_EVENT))
}

export function saveOwnerKey(
  slug: string,
  ownerKey: string,
  title: string
): void {
  const store = read()
  store[slug] = { ownerKey, title, createdAt: new Date().toISOString() }
  write(store)
  emitChange()
}

export function getOwnerKey(slug: string): string | null {
  return read()[slug]?.ownerKey ?? null
}

export function listOwned(): Array<{
  slug: string
  ownerKey: string
  title: string
  createdAt: string
}> {
  const store = read()
  return Object.entries(store)
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function removeOwnerKey(slug: string): void {
  const store = read()
  delete store[slug]
  write(store)
  emitChange()
}
