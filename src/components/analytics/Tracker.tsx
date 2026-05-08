"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

const HEARTBEAT_MS = 30_000
const TRACK_URL = "/api/track"

function gatherSignals() {
  if (typeof window === "undefined") return undefined
  const nav = window.navigator
  return {
    webdriver: nav.webdriver === true,
    cookiesEnabled: nav.cookieEnabled,
    languages: Array.isArray(nav.languages) ? nav.languages.length : undefined,
    hardwareConcurrency: nav.hardwareConcurrency,
    screenWidth: window.screen?.width,
  }
}

function shouldSkip(path: string): boolean {
  if (!path) return true
  if (path.startsWith("/admin")) return true
  if (path.startsWith("/stats")) return true
  return false
}

async function postEvent(body: Record<string, unknown>): Promise<void> {
  try {
    await fetch(TRACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
      keepalive: true,
    })
  } catch {
    // Network blip / extension blocking — fine to drop, the next event resyncs.
  }
}

function sendBeacon(body: Record<string, unknown>): void {
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([JSON.stringify(body)], {
        type: "application/json",
      })
      navigator.sendBeacon(TRACK_URL, blob)
      return
    }
  } catch {}
  void postEvent(body)
}

export function Tracker() {
  const pathname = usePathname()
  const enteredAtRef = useRef<number>(Date.now())
  const lastReportedAtRef = useRef<number>(Date.now())
  const visibleRef = useRef<boolean>(
    typeof document === "undefined" ? true : !document.hidden
  )
  const currentPathRef = useRef<string>(pathname ?? "/")

  // Send "view" + start heartbeat for the current path. On path change, send
  // "leave" for the previous path then re-enter the new one.
  useEffect(() => {
    if (!pathname || shouldSkip(pathname)) return

    const path = pathname
    currentPathRef.current = path
    enteredAtRef.current = Date.now()
    lastReportedAtRef.current = Date.now()
    visibleRef.current =
      typeof document === "undefined" ? true : !document.hidden

    void postEvent({
      event: "view",
      path,
      referrer:
        typeof document !== "undefined" ? document.referrer || undefined : undefined,
      signals: gatherSignals(),
    })

    function flushHeartbeat() {
      if (!visibleRef.current) return
      const now = Date.now()
      const delta = now - lastReportedAtRef.current
      lastReportedAtRef.current = now
      if (delta <= 0) return
      void postEvent({ event: "heartbeat", path, durationMs: delta })
    }

    const interval = window.setInterval(flushHeartbeat, HEARTBEAT_MS)

    function onVisibility() {
      if (document.hidden) {
        // Pause: report what's accumulated, freeze the clock.
        const now = Date.now()
        const delta = now - lastReportedAtRef.current
        if (delta > 0) {
          sendBeacon({ event: "heartbeat", path, durationMs: delta })
        }
        visibleRef.current = false
      } else {
        // Resume: clock starts again from now.
        lastReportedAtRef.current = Date.now()
        visibleRef.current = true
      }
    }

    function onPageHide() {
      const now = Date.now()
      const delta = visibleRef.current
        ? now - lastReportedAtRef.current
        : 0
      sendBeacon({
        event: "leave",
        path,
        durationMs: Math.max(0, delta),
      })
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onPageHide)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onPageHide)
      // Send any remaining time as a "leave" before unmount.
      const now = Date.now()
      const delta = visibleRef.current ? now - lastReportedAtRef.current : 0
      if (delta > 0) {
        sendBeacon({ event: "leave", path, durationMs: delta })
      }
    }
  }, [pathname])

  return null
}
