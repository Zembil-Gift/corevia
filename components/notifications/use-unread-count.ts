"use client"

import { useEffect, useState } from "react"
import { fetchUnreadCount, NOTIFICATIONS_CHANGED, type NotificationAudience } from "@/lib/notifications-api"

// ponytail: 60s polling; switch to SSE if people need instant delivery.
const POLL_MS = 60_000

export function useUnreadCount(audience: NotificationAudience, enabled = true) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let active = true
    const refresh = () => {
      if (document.visibilityState === "hidden") return
      fetchUnreadCount(audience)
        .then((n) => active && setCount(n))
        .catch(() => {})
    }
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [audience, enabled])

  return count
}
