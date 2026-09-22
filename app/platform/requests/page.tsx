"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Inbox, Mail, Building2, UserPlus, X } from "lucide-react"
import { fetchSignupRequests, rejectSignupRequest, slugify, type SignupRequest } from "@/lib/platform-api"
import { confirmDialog } from "@/components/ui/app-dialog"

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  const styles: Record<string, string> = {
    PENDING: "bg-amber-500/15 text-amber-300",
    APPROVED: "bg-emerald-500/15 text-emerald-300",
    REJECTED: "bg-rose-500/15 text-rose-300",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[s] ?? "bg-muted text-muted-foreground"}`}>
      {s.charAt(0) + s.slice(1).toLowerCase()}
    </span>
  )
}

export default function SignupRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<SignupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    setError("")
    try {
      setRequests(await fetchSignupRequests())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function register(req: SignupRequest) {
    const params = new URLSearchParams({
      requestId: String(req.id),
      name: req.companyName,
      slug: slugify(req.companyName),
      managerName: req.contactName,
      managerEmail: req.email,
    })
    router.push(`/platform/register?${params.toString()}`)
  }

  async function reject(req: SignupRequest) {
    if (!(await confirmDialog({ title: "Reject signup request", message: `Reject the signup request from ${req.companyName}?`, confirmText: "Reject", destructive: true }))) return
    setBusyId(req.id)
    try {
      await rejectSignupRequest(req.id)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const pending = requests.filter((r) => r.status.toUpperCase() === "PENDING")

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Signup requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Self-serve “Start free” submissions. Click <span className="font-medium text-foreground">Register</span> to
            provision the organization — its manager gets a generated password by email.
          </p>
        </div>
        {pending.length > 0 && (
          <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            {pending.length} pending
          </span>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">No signup requests yet</p>
          <p className="mt-1 text-sm text-muted-foreground">New “Start free” submissions will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => {
            const isPending = req.status.toUpperCase() === "PENDING"
            return (
              <li key={req.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="truncate font-semibold text-foreground">{req.companyName}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {req.contactName}
                      <span className="mx-1.5 text-border">·</span>
                      <a href={`mailto:${req.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {req.email}
                      </a>
                    </p>
                    {(req.phone || req.industry || req.websiteUrl) && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {req.industry && <span>{req.industry}</span>}
                        {req.phone && <span>{req.phone}</span>}
                        {req.websiteUrl && (
                          <a
                            href={req.websiteUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-emerald-400 hover:underline"
                          >
                            {req.websiteUrl.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    )}
                    {req.message && (
                      <p className="mt-2 max-w-prose rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                        {req.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Submitted {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => reject(req)}
                        disabled={busyId === req.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => register(req)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
                      >
                        <UserPlus className="h-4 w-4" />
                        Register
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
