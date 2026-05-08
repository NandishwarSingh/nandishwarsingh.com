import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { QrDashboard } from "@/components/tools/qr/QrDashboard"
import { qrLinks } from "@/lib/db"

export const dynamic = "force-dynamic"

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `QR · ${slug} — Nandishwar Singh`,
    description: "Click analytics for a tracked QR code.",
    robots: { index: false, follow: false },
  }
}

export default async function QrDashboardPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const links = await qrLinks()
  const exists = await links.findOne(
    { slug, archived: { $ne: true } },
    { projection: { _id: 1 } }
  )
  if (!exists) notFound()
  return <QrDashboard slug={slug} />
}
