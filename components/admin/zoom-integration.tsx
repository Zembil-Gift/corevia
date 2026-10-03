"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { disconnectZoom, fetchZoomConnection, startZoomConnect, type ZoomConnection } from "@/lib/zoom-connect-api"

export function ZoomIntegration() {
  const [conn, setConn] = useState<ZoomConnection | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchZoomConnection()
      .then(setConn)
      .catch((e: Error) => setError(e.message))
  }, [])

  const handleDisconnect = async () => {
    setBusy(true)
    setError(null)
    try {
      await disconnectZoom()
      setConn((c) => c && { ...c, connected: false, email: null })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect Zoom")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Zoom</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {conn?.connected ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" aria-hidden /> Connected as {conn.email}
              </span>
            ) : (
              "Online interviews get a Zoom meeting on your account that guests join without waiting to be admitted."
            )}
          </p>
        </div>
        {conn?.connected ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleDisconnect}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
            Disconnect
          </Button>
        ) : (
          conn?.configured && (
            <Button type="button" size="sm" onClick={startZoomConnect} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Sign in with Zoom
            </Button>
          )
        )}
      </div>

      {!conn && !error && <Loader2 className="mt-4 size-5 animate-spin text-zinc-500" aria-label="Loading" />}
      {conn && !conn.configured && (
        <p className="mt-4 text-sm text-amber-400">Zoom isn&apos;t set up on the server yet (ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET).</p>
      )}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </section>
  )
}
