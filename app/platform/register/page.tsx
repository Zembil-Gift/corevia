"use client"

import type React from "react"
import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createOrganization, slugify } from "@/lib/platform-api"

function RegisterOrganizationForm() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get("requestId")

  const [form, setForm] = useState({
    name: searchParams.get("name") ?? "",
    slug: searchParams.get("slug") ?? slugify(searchParams.get("name") ?? ""),
    slugTouched: Boolean(searchParams.get("slug")),
    managerName: searchParams.get("managerName") ?? "",
    managerEmail: searchParams.get("managerEmail") ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState<{ name: string; slug: string; email: string } | null>(null)

  const fromRequest = Boolean(requestId)

  function update(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "name" && !prev.slugTouched) next.slug = slugify(value)
      if (field === "slug") next.slugTouched = true
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await createOrganization({
        name: form.name.trim(),
        slug: form.slug.trim(),
        managerName: form.managerName.trim(),
        managerEmail: form.managerEmail.trim(),
        requestId: requestId ? Number(requestId) : undefined,
      })
      setDone({ name: form.name.trim(), slug: form.slug.trim(), email: form.managerEmail.trim() })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-foreground">Organization created</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{done.name}</span> (/{done.slug}) is live. A generated
            password was emailed to <span className="font-semibold text-foreground">{done.email}</span> so the manager
            can sign in at <span className="font-semibold text-foreground">/login</span>.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/platform/organizations"
              className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              View organizations
            </Link>
            <Link
              href="/platform/requests"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Back to requests
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Register organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {fromRequest
            ? "Review the details from this signup request, then create the tenant and its first manager."
            : "Creates a new tenant and its first manager account in one step."}
        </p>
        {fromRequest && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Prefilled from signup request #{requestId}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Organization</p>
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Acme Inc." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="acme"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="lowercase letters, numbers and hyphens"
              required
            />
            <p className="text-xs text-muted-foreground">
              Used in public URLs, e.g. <code className="rounded bg-muted px-1 py-0.5">/public/{form.slug || "acme"}/jobs</code>
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">First manager</p>
          <div className="space-y-2">
            <Label htmlFor="managerName">Manager name</Label>
            <Input id="managerName" value={form.managerName} onChange={(e) => update("managerName", e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="managerEmail">Manager email</Label>
            <Input id="managerEmail" type="email" value={form.managerEmail} onChange={(e) => update("managerEmail", e.target.value)} placeholder="jane@acme.com" required />
          </div>
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            A secure password is generated automatically and emailed to the manager. They&apos;re prompted to change it on first sign-in.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
        >
          {loading ? "Creating…" : "Create organization & email credentials"}
        </Button>
      </form>
    </div>
  )
}

export default function RegisterOrganizationPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg text-sm text-muted-foreground">Loading…</div>}>
      <RegisterOrganizationForm />
    </Suspense>
  )
}
