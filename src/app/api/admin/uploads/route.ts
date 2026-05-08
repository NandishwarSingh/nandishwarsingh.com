import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { randomBytes } from "node:crypto"
import type { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPLOAD_ROOT = join(process.cwd(), "public", "uploads")
const MAX_BYTES = 25 * 1024 * 1024 // 25 MB
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
])

function extFor(type: string): string {
  switch (type) {
    case "image/png":
      return "png"
    case "image/jpeg":
      return "jpg"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    case "image/svg+xml":
      return "svg"
    case "image/avif":
      return "avif"
    case "video/mp4":
      return "mp4"
    case "video/webm":
      return "webm"
    case "video/quicktime":
      return "mov"
    default:
      return "bin"
  }
}

export async function POST(request: NextRequest) {
  const ct = request.headers.get("content-type") ?? ""
  if (!ct.startsWith("multipart/form-data")) {
    return Response.json(
      { error: "Use multipart/form-data with a `file` field" },
      { status: 400 }
    )
  }
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 })
  }
  const file = form.get("file")
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing `file` field" }, { status: 400 })
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json(
      { error: `Unsupported type: ${file.type}` },
      { status: 415 }
    )
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `Too big (${file.size} > ${MAX_BYTES})` },
      { status: 413 }
    )
  }

  const now = new Date()
  const subdir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`
  const dir = join(UPLOAD_ROOT, subdir)
  await mkdir(dir, { recursive: true })
  const id = randomBytes(8).toString("hex")
  const filename = `${id}.${extFor(file.type)}`
  const buf = Buffer.from(await file.arrayBuffer())
  await writeFile(join(dir, filename), buf)

  const url = `/uploads/${subdir}/${filename}`
  return Response.json({
    ok: true,
    url,
    filename,
    type: file.type,
    size: file.size,
  })
}
