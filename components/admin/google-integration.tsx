"use client"

import { useEffect, useState } from "react"
import { CalendarDays, CheckCircle2, Loader2, Sheet, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isViceManagerClient } from "@/lib/admin-client-auth"
import {
  disconnectGoogle,
  fetchGoogleConnection,
  startGoogleConnect,
  type GoogleConnection,
  type GoogleFeature,
} from "@/lib/google-connect-api"
import { GoogleSheetsSync } from "@/components/admin/google-sheets-sync"

const FEATURES: { key: GoogleFeature; label: string; description: string; icon: typeof Sheet; managerOnly?: boolean }[] = [
  {
    key: "calendar",
    label: "Google Calendar",
    description: "Interviews you schedule go into your calendar, and Google sends the invites with a Meet link.",
    icon: CalendarDays,
    managerOnly: true,
  },
  {
    key: "sheets",
    label: "Google Sheets",
    description: "Keep a spreadsheet of employees, attendance, payroll and more updated automatically.",
    icon: Sheet,
  },
]

export function GoogleIntegration() {
  const [conn, setConn] = useState<GoogleConnection | null>(null)
  const [isVice, setIsVice] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsVice(isViceManagerClient())
    fetchGoogleConnection()
      .then(setConn)
      .catch((e: Error) => setError(e.message))
  }, [])

  const features = FEATURES.filter((f) => !(isVice && f.managerOnly))
  const granted = (f: GoogleFeature) => Boolean(conn?.[f])

  // Asks Google for this feature plus everything already granted, so nothing is lost.
  const enable = (feature: GoogleFeature) =>
    startGoogleConnect([...features.map((f) => f.key).filter(granted), feature])

  const handleDisconnect = async () => {
    setBusy(true)
    setError(null)
    try {
      await disconnectGoogle()
      setConn((c) => c && { ...c, connected: false, email: null, calendar: false, sheets: false })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect Google")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Google</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {conn?.connected ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" aria-hidden /> Connected as {conn.email}
              </span>
            ) : (
              "Connect your Google account to use Calendar and Sheets."
            )}
          </p>
        </div>
        {conn?.connected && (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleDisconnect}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
            Disconnect
          </Button>
        )}
      </div>

      {!conn && !error && <Loader2 className="mt-4 size-5 animate-spin text-zinc-500" aria-label="Loading" />}
      {conn && !conn.configured && (
        <p className="mt-4 text-sm text-amber-400">Google isn&apos;t set up on the server yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).</p>
      )}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {conn?.configured && (
        <ul className="mt-4 space-y-3">
          {features.map(({ key, label, description, icon: Icon }) => (
            <li key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 p-3">
              <div className="flex min-w-0 items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-zinc-400" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-zinc-500">{description}</p>
                </div>
              </div>
              {granted(key) ? (
                <span className="text-xs font-medium text-primary">Enabled</span>
              ) : (
                <Button type="button" size="sm" onClick={() => enable(key)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Enable
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {conn?.sheets && <GoogleSheetsSync />}
    </section>
  )
}
