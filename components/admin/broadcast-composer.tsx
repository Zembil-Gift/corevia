"use client"

import { useEffect, useRef, useState } from "react"
import { Bold, Italic, Link2, List, ListOrdered, Loader2, Mail, Monitor, Send, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { confirmDialog } from "@/components/ui/app-dialog"
import { isViceManagerClient } from "@/lib/admin-client-auth"
import type { SubOrganization } from "@/lib/sub-orgs-api"
import {
  fetchBroadcasts,
  fetchRecipientCount,
  previewBroadcast,
  sendBroadcast,
  type Broadcast,
  type BroadcastPreview,
} from "@/lib/broadcasts-api"

type Format = "bold" | "italic" | "link" | "bullets" | "numbers"

const TOOLBAR: { format: Format; label: string; icon: typeof Bold }[] = [
  { format: "bold", label: "Bold", icon: Bold },
  { format: "italic", label: "Italic", icon: Italic },
  { format: "link", label: "Link", icon: Link2 },
  { format: "bullets", label: "Bulleted list", icon: List },
  { format: "numbers", label: "Numbered list", icon: ListOrdered },
]

/** Wraps the selection (or inserts a sample) with the markdown the backend's SimpleMarkdown understands. */
function applyFormat(value: string, start: number, end: number, format: Format) {
  const selected = value.slice(start, end)
  const wrap = (before: string, after: string, sample: string) => {
    const text = selected || sample
    const next = value.slice(0, start) + before + text + after + value.slice(end)
    return { next, selStart: start + before.length, selEnd: start + before.length + text.length }
  }
  switch (format) {
    case "bold":
      return wrap("**", "**", "bold text")
    case "italic":
      return wrap("*", "*", "italic text")
    case "link":
      return wrap("[", "](https://)", selected ? selected : "link text")
    case "bullets":
    case "numbers": {
      const lines = (selected || "List item").split("\n")
      const prefixed = lines.map((l, i) => (format === "bullets" ? "- " : `${i + 1}. `) + l).join("\n")
      const lead = start > 0 && value[start - 1] !== "\n" ? "\n" : ""
      const next = value.slice(0, start) + lead + prefixed + value.slice(end)
      return { next, selStart: start + lead.length, selEnd: start + lead.length + prefixed.length }
    }
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

export function BroadcastComposer() {
  const [isVice, setIsVice] = useState(false)
  const [branches, setBranches] = useState<SubOrganization[]>([])
  const [everyone, setEveryone] = useState(true)
  const [selected, setSelected] = useState<number[]>([])
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [preview, setPreview] = useState<BroadcastPreview | null>(null)
  const [previewTab, setPreviewTab] = useState<"email" | "app">("email")
  const [mobile, setMobile] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [history, setHistory] = useState<Broadcast[]>([])
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const targetIds = everyone || isVice ? [] : selected

  useEffect(() => {
    setIsVice(isViceManagerClient())
    fetch("/api/admin/sub-organizations", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => {})
    fetchBroadcasts()
      .then((p) => setHistory(p.content))
      .catch(() => {})
  }, [])

  const targetKey = targetIds.join(",")
  useEffect(() => {
    if (!everyone && !isVice && selected.length === 0) {
      setRecipientCount(0)
      return
    }
    fetchRecipientCount(targetKey ? targetKey.split(",").map(Number) : [])
      .then(setRecipientCount)
      .catch(() => setRecipientCount(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, everyone, isVice])

  // Same server renderer as the real send, refreshed shortly after typing stops.
  useEffect(() => {
    if (!subject.trim() || !body.trim()) {
      setPreview(null)
      return
    }
    let stale = false
    setPreviewing(true)
    const timer = setTimeout(() => {
      previewBroadcast({ subject, body, subOrganizationIds: targetIds, sendEmail })
        .then((p) => !stale && setPreview(p))
        .catch((err: Error) => !stale && setError(err.message))
        .finally(() => !stale && setPreviewing(false))
    }, 400)
    return () => {
      stale = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, body])

  const format = (f: Format) => {
    const el = bodyRef.current
    if (!el) return
    const { next, selStart, selEnd } = applyFormat(body, el.selectionStart, el.selectionEnd, f)
    setBody(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(selStart, selEnd)
    })
  }

  const toggleBranch = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const canSend = subject.trim() && body.trim() && (everyone || isVice || selected.length > 0) && !sending

  const audienceLabel = isVice
    ? "your branch"
    : everyone
      ? "everyone in the organization"
      : branches.filter((b) => selected.includes(b.id)).map((b) => b.name).join(", ")

  const handleSend = async () => {
    const ok = await confirmDialog({
      title: "Send broadcast?",
      message: `"${subject.trim()}" will go to ${recipientCount ?? "all"} people in ${audienceLabel}${sendEmail ? " by notification and email" : " as a notification"}. This can't be undone.`,
      confirmText: "Send",
    })
    if (!ok) return
    setSending(true)
    setError(null)
    setNotice(null)
    try {
      const sent = await sendBroadcast({ subject, body, subOrganizationIds: targetIds, sendEmail })
      setHistory((prev) => [sent, ...prev])
      setSubject("")
      setBody("")
      setNotice(`Sent to ${sent.recipientCount} ${sent.recipientCount === 1 ? "person" : "people"}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send broadcast")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-zinc-200">Send to</legend>
            {isVice ? (
              <p className="text-sm text-zinc-400">
                Everyone in your branch{branches[0] ? ` (${branches[0].name})` : ""}: employees and vice managers.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="audience" checked={everyone} onChange={() => setEveryone(true)} />
                    Everyone
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="audience" checked={!everyone} onChange={() => setEveryone(false)} />
                    Specific branches
                  </label>
                </div>
                {!everyone && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {branches.map((b) => (
                      <label
                        key={b.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1 text-sm ${
                          selected.includes(b.id) ? "border-primary text-white" : "border-zinc-700 text-zinc-400"
                        }`}
                      >
                        <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggleBranch(b.id)} />
                        {b.name}
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-zinc-500">Employees and vice managers of the chosen branches receive it.</p>
              </>
            )}
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="broadcast-subject">Subject</Label>
            <Input id="broadcast-subject" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="broadcast-body">Message</Label>
            <div role="toolbar" aria-label="Formatting" className="flex gap-1">
              {TOOLBAR.map(({ format: f, label, icon: Icon }) => (
                <button
                  key={f}
                  type="button"
                  aria-label={label}
                  title={label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format(f)}
                  className="rounded-md border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-300 hover:border-primary hover:text-primary"
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <textarea
              id="broadcast-body"
              ref={bodyRef}
              rows={10}
              maxLength={10000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <p className="text-xs text-zinc-500">
              **bold**, *italic*, [link](https://…), lines starting with "- " or "1. " for lists. Leave a blank line between paragraphs.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            <Mail className="size-4 text-zinc-500" aria-hidden /> Also send by email
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {notice && <p className="text-sm text-primary">{notice}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={!canSend}
              onClick={handleSend}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send broadcast
            </Button>
            <span className="text-sm text-zinc-400">
              {recipientCount === null ? "" : `${recipientCount} ${recipientCount === 1 ? "recipient" : "recipients"}`}
            </span>
          </div>
        </section>

        <section aria-label="Preview" className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <div role="tablist" aria-label="Preview type" className="flex gap-1">
              {(["email", "app"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={previewTab === tab}
                  onClick={() => setPreviewTab(tab)}
                  className={`rounded-md px-3 py-1 text-sm ${
                    previewTab === tab ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab === "email" ? "Email" : "In-app notification"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {previewing && <Loader2 className="mr-1 size-4 animate-spin text-zinc-500" aria-label="Updating preview" />}
              {previewTab === "email" && (
                <>
                  <button
                    type="button"
                    aria-label="Desktop width"
                    aria-pressed={!mobile}
                    onClick={() => setMobile(false)}
                    className={`rounded-md p-1.5 ${!mobile ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <Monitor className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Mobile width"
                    aria-pressed={mobile}
                    onClick={() => setMobile(true)}
                    className={`rounded-md p-1.5 ${mobile ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <Smartphone className="size-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {!preview ? (
            <p className="px-4 py-16 text-center text-sm text-zinc-500">Write a subject and message to see the preview.</p>
          ) : previewTab === "email" ? (
            <>
              <p className="truncate border-b border-zinc-800 px-4 py-2 text-sm font-semibold text-white">{preview.subject}</p>
              <div className="flex justify-center bg-[#eef3f0]">
                <iframe
                  title="Email preview"
                  sandbox=""
                  srcDoc={preview.emailHtml}
                  className="h-[600px] border-0 transition-[width]"
                  style={{ width: mobile ? 375 : "100%" }}
                />
              </div>
            </>
          ) : (
            <div className="p-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-white">{subject}</p>
                  <span className="text-xs text-zinc-500">Just now</span>
                </div>
                <p className="mb-3 text-xs text-zinc-500">Announcement</p>
                <div
                  className="rich-text text-sm leading-relaxed text-zinc-300"
                  // bodyHtml is escaped + whitelisted server-side (SimpleMarkdown).
                  dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <h2 className="border-b border-zinc-800 px-4 py-3 text-sm font-semibold text-white">Sent broadcasts</h2>
        {history.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Nothing sent yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {history.map((b) => (
              <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{b.subject}</p>
                  <p className="text-xs text-zinc-500">
                    {b.subOrganizations.length === 0 ? "Everyone" : b.subOrganizations.map((s) => s.name).join(", ")}
                    {" · "}by {b.senderName}
                    {b.sendEmail ? " · with email" : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-400">
                  <p>{formatDate(b.createdAt)}</p>
                  <p>
                    Read by {b.readCount} of {b.recipientCount}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
