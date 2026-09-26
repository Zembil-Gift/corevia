"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type SheetSync = {
  enabled: boolean
  spreadsheetUrl: string | null
  datasets: string[]
  availableDatasets: string[]
  lastSyncedAt: string | null
  lastError: string | null
}

const LABELS: Record<string, string> = {
  EMPLOYEES: "Employees",
  ATTENDANCE: "Attendance (last 90 days)",
  PAYMENTS: "Payroll",
  METRICS: "Metrics",
  JOB_APPLICATIONS: "Job applications",
}

const BASE = "/api/manager/google/sheets"

async function request(path: string, init?: RequestInit): Promise<SheetSync> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Google Sheets request failed")
  return data as SheetSync
}

export function GoogleSheetsSync() {
  const [sync, setSync] = useState<SheetSync | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const [busy, setBusy] = useState<"save" | "sync" | "off" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apply = (s: SheetSync) => {
    setSync(s)
    setChosen(s.enabled ? s.datasets : s.availableDatasets)
  }

  useEffect(() => {
    request("").then(apply).catch((e: Error) => setError(e.message))
  }, [])

  const run = async (kind: "save" | "sync" | "off", work: () => Promise<SheetSync | void>) => {
    setBusy(kind)
    setError(null)
    try {
      const result = await work()
      if (result) apply(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(null)
    }
  }

  const save = () =>
    run("save", () =>
      request("", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ datasets: chosen }) }),
    )
  const syncNow = () => run("sync", () => request("/sync", { method: "POST" }))
  const turnOff = () =>
    run("off", async () => {
      await fetch(BASE, { method: "DELETE" })
      return request("")
    })

  if (!sync) return error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null

  const unchanged = sync.enabled && [...chosen].sort().join() === [...sync.datasets].sort().join()

  return (
    <div className="mt-5 border-t border-zinc-800 pt-5">
      <h3 className="text-sm font-semibold text-white">Live spreadsheet</h3>
      <p className="mt-1 text-xs text-zinc-500">
        A spreadsheet in your Google Drive with one tab per dataset, refreshed every hour. Edits made in the sheet are
        overwritten on the next sync.
      </p>

      <fieldset className="mt-3 flex flex-wrap gap-2">
        <legend className="sr-only">Datasets</legend>
        {sync.availableDatasets.map((d) => (
          <label
            key={d}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1 text-sm ${
              chosen.includes(d) ? "border-primary text-white" : "border-zinc-700 text-zinc-400"
            }`}
          >
            <input
              type="checkbox"
              checked={chosen.includes(d)}
              onChange={(e) => setChosen((prev) => (e.target.checked ? [...prev, d] : prev.filter((x) => x !== d)))}
            />
            {LABELS[d] ?? d}
          </label>
        ))}
      </fieldset>

      {sync.enabled && (
        <p className="mt-3 text-xs text-zinc-400">
          {sync.lastSyncedAt ? `Last synced ${new Date(sync.lastSyncedAt).toLocaleString()}` : "Not synced yet"}
          {sync.spreadsheetUrl && (
            <>
              {" · "}
              <a href={sync.spreadsheetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                Open spreadsheet <ExternalLink className="size-3" aria-hidden />
              </a>
            </>
          )}
        </p>
      )}
      {sync.lastError && <p className="mt-2 text-sm text-amber-400">{sync.lastError}</p>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy !== null || chosen.length === 0 || unchanged}
          onClick={save}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {busy === "save" && <Loader2 className="size-4 animate-spin" />}
          {sync.enabled ? "Save datasets" : "Create spreadsheet"}
        </Button>
        {sync.enabled && (
          <>
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={syncNow}>
              {busy === "sync" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Sync now
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy !== null} onClick={turnOff} className="text-zinc-400">
              Stop syncing
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
