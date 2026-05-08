import { autoblogConfigured } from "@/lib/autoblog/config"
import { AutoblogPanel } from "@/components/admin/AutoblogPanel"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Auto-blog — admin",
  robots: { index: false, follow: false },
}

export default function AutoblogPage() {
  return <AutoblogPanel configured={autoblogConfigured()} />
}
