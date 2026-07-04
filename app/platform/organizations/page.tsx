"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { fetchPlatformStats, setOrgStatus, type OrgStats } from "@/lib/platform-api"
import { OrgStatusBadge } from "@/components/platform/ui"

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgStats[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)

  function load() {
    setLoading(true)
    fetchPlatformStats()
      .then((s) => setOrgs(s.organizations))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function toggle(o: OrgStats) {
    setBusy(o.id)
    setError("")
    const action = o.status.toUpperCase() === "ACTIVE" ? "suspend" : "activate"
    try {
      const updated = await setOrgStatus(o.id, action)
      setOrgs((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: updated.status } : x)))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every tenant on the platform, with live metrics.</p>
        </div>
        <Link
          href="/platform/register"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
        >
          <PlusCircle className="h-4 w-4" />
          Register organization
        </Link>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading organizations…</p>
      ) : orgs.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          No organizations yet. Register your first one.
        </p>
      ) : (
        <div className="space-y-4">
          {orgs.map((o) => {
            const active = o.status.toUpperCase() === "ACTIVE"
            return (
              <div key={o.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-foreground">{o.name}</h2>
                      <OrgStatusBadge status={o.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      /{o.slug} · {o.plan} · created {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/o/${o.slug}`}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      View public site
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggle(o)}
                      disabled={busy === o.id}
                      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                        active
                          ? "border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                          : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                      }`}
                    >
                      {busy === o.id ? "Saving…" : active ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  <Metric label="Managers" value={o.managers} />
                  <Metric label="Employees" value={o.employees} />
                  <Metric label="Jobs" value={o.jobs} />
                  <Metric label="Open jobs" value={o.openJobs} />
                  <Metric label="Applicants" value={o.applicants} />
                  <Metric label="Hired" value={o.hired} />
                  <Metric label="Blogs" value={`${o.publishedBlogs}/${o.blogs}`} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
