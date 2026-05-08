import "server-only"
import geoip from "geoip-lite"

export type GeoLookup = {
  country?: string
  region?: string
  city?: string
}

export function lookupGeo(ip: string): GeoLookup {
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") {
    return {}
  }
  // Strip IPv6-mapped IPv4 prefix (::ffff:)
  const clean = ip.replace(/^::ffff:/i, "")
  const r = geoip.lookup(clean)
  if (!r) return {}
  return {
    country: r.country || undefined,
    region: r.region || undefined,
    city: r.city || undefined,
  }
}
