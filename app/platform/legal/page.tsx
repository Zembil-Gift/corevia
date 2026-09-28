"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { ExternalLink, Loader2, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type DocType = "terms" | "privacy"

interface LegalDocument {
  type: DocType
  title: string
  content: string
  updatedAt: string | null
}

const DOCS: { type: DocType; label: string; href: string }[] = [
  { type: "terms", label: "Terms of Service", href: "/terms" },
  { type: "privacy", label: "Privacy Policy", href: "/privacy" },
]

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed")
  return data
}

function DocEditor({
  meta,
  doc,
  onChanged,
}: {
  meta: (typeof DOCS)[number]
  doc: LegalDocument | undefined
  onChanged: () => Promise<void>
}) {
  const [title, setTitle] = useState(doc?.title ?? meta.label)
  const [content, setContent] = useState(doc?.content ?? "")
  const [busy, setBusy] = useState<"save" | "delete" | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setTitle(doc?.title ?? meta.label)
    setContent(doc?.content ?? "")
  }, [doc, meta.label])

  const run = async (kind: "save" | "delete", action: () => Promise<unknown>, done: string) => {
    setBusy(kind)
    setMessage(null)
    try {
      await action()
      await onChanged()
      setMessage({ ok: true, text: done })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Request failed" })
    } finally {
      setBusy(null)
    }
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    run("save", () => send(`/api/platform/legal/${meta.type}`, "PUT", { title, content }), "Saved")
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{meta.label}</h2>
          <p className="text-xs text-muted-foreground">
            {doc
              ? doc.updatedAt && `Last updated ${new Date(doc.updatedAt).toLocaleString()}`
              : "Not published. Saving will create it."}
          </p>
        </div>
        <Link
          href={meta.href}
          target="_blank"
          className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
        >
          View public page <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${meta.type}-title`}>Title</Label>
        <Input id={`${meta.type}-title`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${meta.type}-content`}>Content</Label>
        <textarea
          id={`${meta.type}-content`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <p className="text-xs text-muted-foreground">Plain text. Line breaks are kept on the public page.</p>
      </div>

      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-emerald-400" : "text-destructive"}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {doc && (
          <Button
            type="button"
            variant="ghost"
            className="text-red-400 hover:text-red-300"
            disabled={busy !== null}
            onClick={() => setConfirmOpen(true)}
          >
            {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        )}
        <Button type="submit" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400" disabled={busy !== null}>
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <AlertDialog.Title className="text-lg font-semibold text-white">Delete {meta.label}</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-zinc-400">
              The public page will show &ldquo;not available&rdquo; until you save it again.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="ghost" className="text-zinc-300">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  className="bg-red-500 text-white hover:bg-red-400"
                  onClick={() => run("delete", () => send(`/api/platform/legal/${meta.type}`, "DELETE"), "Deleted")}
                >
                  Delete
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </form>
  )
}

export default function LegalDocumentsPage() {
  const [docs, setDocs] = useState<LegalDocument[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/legal", { cache: "no-store" })
      const data = await res.json().catch(() => [])
      if (res.ok && Array.isArray(data)) setDocs(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Terms &amp; privacy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The Terms of Service and Privacy Policy shown on the public site and linked from signup.
        </p>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        DOCS.map((meta) => (
          <DocEditor key={meta.type} meta={meta} doc={docs.find((d) => d.type === meta.type)} onChanged={load} />
        ))
      )}
    </div>
  )
}
