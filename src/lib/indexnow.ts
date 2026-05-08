import { SITE } from "@/lib/site"

export const INDEXNOW_KEY = "a7f3c9e2b1d846f5904a8c6e9d27b5f1"
export const INDEXNOW_KEY_LOCATION = `${SITE.origin}/${INDEXNOW_KEY}.txt`

const ENDPOINT = "https://api.indexnow.org/IndexNow"

export type IndexNowResult = {
  ok: boolean
  status: number
  body: string
}

export async function pingIndexNow(urls: string[]): Promise<IndexNowResult> {
  const host = new URL(SITE.origin).host
  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls.filter((u) => u.startsWith(SITE.origin)),
  }
  if (payload.urlList.length === 0) {
    return { ok: false, status: 0, body: "no valid urls (must be same origin)" }
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  })
  const text = await res.text().catch(() => "")
  return { ok: res.ok, status: res.status, body: text }
}
