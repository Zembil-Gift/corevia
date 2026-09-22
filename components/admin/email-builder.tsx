"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ImagePlus, Loader2, Monitor, RotateCcw, Send, Smartphone, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  fetchEmailTemplates,
  previewEmailTemplate,
  removeEmailLogo,
  resetEmailTemplate,
  saveEmailTemplate,
  sendTestEmail,
  uploadEmailLogo,
  type EmailPreview,
  type EmailTemplate,
  type EmailTemplateDraft,
  type EmailTemplates,
} from "@/lib/email-templates-api"

const AUDIENCE_ORDER = ["Employee", "Candidate", "Manager", "Vice manager"]

const LABELS: Record<string, string> = {
  EMPLOYEE_PASSWORD: "Account credentials",
  EMPLOYEE_EMAIL_CHANGED: "Sign-in email changed",
  EMPLOYEE_PAYMENT_RECEIVED: "Salary payment received",
  HIRING_SELECTED_FOR_INTERVIEW: "Selected for interview",
  HIRING_REJECTED_PRE_INTERVIEW: "Application declined",
  HIRING_HIRED: "Hired",
  HIRING_REJECTED_POST_INTERVIEW: "Declined after interview",
  ADMIN_PAYROLL_REMINDER: "Payroll reminder",
  MANAGER_NEW_JOB_APPLICATION: "New job application",
  VICE_MANAGER_WELCOME: "Account credentials",
  VICE_MANAGER_PAYROLL_REMINDER: "Branch payroll reminder",
  VICE_MANAGER_NEW_EMPLOYEE: "New employee in branch",
}

type Field = keyof EmailTemplateDraft

const effective = (t: EmailTemplate): EmailTemplateDraft => ({
  subject: t.subject ?? t.defaultSubject,
  heading: t.heading ?? t.defaultHeading,
  message: t.message ?? t.defaultMessage,
})

// A field left equal to the default is saved as blank, so it keeps following future default changes.
const toOverride = (t: EmailTemplate, d: EmailTemplateDraft): EmailTemplateDraft => ({
  subject: d.subject === t.defaultSubject ? "" : d.subject,
  heading: d.heading === t.defaultHeading ? "" : d.heading,
  message: d.message === t.defaultMessage ? "" : d.message,
})

export function EmailBuilder() {
  const [data, setData] = useState<EmailTemplates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [draft, setDraft] = useState<EmailTemplateDraft>({ subject: "", heading: "", message: "" })
  const [preview, setPreview] = useState<EmailPreview | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [busy, setBusy] = useState<"save" | "reset" | "test" | "logo" | null>(null)
  const [mobile, setMobile] = useState(false)
  const focused = useRef<{ field: Field; el: HTMLInputElement | HTMLTextAreaElement } | null>(null)
  const logoInput = useRef<HTMLInputElement>(null)

  const selected = data?.templates.find((t) => t.type === selectedType) ?? null

  const select = useCallback((t: EmailTemplate) => {
    setSelectedType(t.type)
    setDraft(effective(t))
    setNotice(null)
    focused.current = null
  }, [])

  useEffect(() => {
    fetchEmailTemplates()
      .then((loaded) => {
        setData(loaded)
        if (loaded.templates[0]) select(loaded.templates[0])
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [select])

  // Re-render the preview server-side (same renderer as real sends) shortly after edits stop.
  useEffect(() => {
    if (!selectedType) return
    let stale = false
    setPreviewing(true)
    const timer = setTimeout(() => {
      previewEmailTemplate(selectedType, draft)
        .then((p) => !stale && setPreview(p))
        .catch((err: Error) => !stale && setError(err.message))
        .finally(() => !stale && setPreviewing(false))
    }, 400)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [selectedType, draft, data?.effectiveLogoUrl])

  const groups = useMemo(() => {
    const templates = data?.templates ?? []
    return AUDIENCE_ORDER.map((audience) => ({
      audience,
      templates: templates.filter((t) => t.audience === audience),
    })).filter((g) => g.templates.length > 0)
  }, [data])

  const dirty = selected ? JSON.stringify(effective(selected)) !== JSON.stringify(draft) : false

  const replaceTemplate = (updated: EmailTemplate) => {
    setData((prev) => prev && { ...prev, templates: prev.templates.map((t) => (t.type === updated.type ? updated : t)) })
  }

  const run = async (kind: "save" | "reset" | "test" | "logo", work: () => Promise<string>) => {
    setBusy(kind)
    setError(null)
    setNotice(null)
    try {
      setNotice(await work())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(null)
    }
  }

  const handleSave = () =>
    selected &&
    run("save", async () => {
      const updated = await saveEmailTemplate(selected.type, toOverride(selected, draft))
      replaceTemplate(updated)
      setDraft(effective(updated))
      return "Template saved."
    })

  const handleReset = () =>
    selected &&
    run("reset", async () => {
      const updated = await resetEmailTemplate(selected.type)
      replaceTemplate(updated)
      setDraft(effective(updated))
      return "Template reset to default."
    })

  const handleTest = () =>
    selected &&
    run("test", async () => {
      const { sentTo } = await sendTestEmail(selected.type, toOverride(selected, draft))
      return `Test email sent to ${sentTo}.`
    })

  const handleLogo = (file: File | undefined) =>
    file &&
    run("logo", async () => {
      setData(await uploadEmailLogo(file))
      return "Email logo updated."
    })

  const handleRemoveLogo = () =>
    run("logo", async () => {
      setData(await removeEmailLogo())
      return "Email logo removed."
    })

  const insertPlaceholder = (key: string) => {
    const target = focused.current ?? null
    const field: Field = target?.field ?? "message"
    const token = `{{${key}}}`
    const value = draft[field]
    const start = target?.el.selectionStart ?? value.length
    const end = target?.el.selectionEnd ?? value.length
    setDraft((d) => ({ ...d, [field]: value.slice(0, start) + token + value.slice(end) }))
    requestAnimationFrame(() => {
      if (!target) return
      target.el.focus()
      target.el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const fieldProps = (field: Field) => ({
    value: draft[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((d) => ({ ...d, [field]: e.target.value })),
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      focused.current = { field, el: e.currentTarget }
    },
  })

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-red-400">{error ?? "Failed to load email templates"}</p>
  }

  const logoSource = data.emailLogoUrl ? "Email logo" : "Company profile logo or default"

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-semibold text-white">Email logo</h2>
          <div className="mt-3 flex h-20 items-center justify-center rounded-lg border border-zinc-800 bg-[#0f1412] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.effectiveLogoUrl} alt="Email logo" className="max-h-full max-w-full object-contain" />
          </div>
          <p className="mt-2 text-xs text-zinc-500">Using: {logoSource}</p>
          <input
            ref={logoInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              handleLogo(e.target.files?.[0])
              e.target.value = ""
            }}
          />
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy !== null}
              onClick={() => logoInput.current?.click()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {busy === "logo" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              Upload
            </Button>
            {data.emailLogoUrl && (
              <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={handleRemoveLogo}>
                <Trash2 className="size-4" /> Remove
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">PNG, JPG, GIF or WEBP up to 5 MB. SVG is not shown by most email apps.</p>
        </section>

        <nav aria-label="Email types" className="space-y-4">
          {groups.map((group) => (
            <div key={group.audience}>
              <h3 className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Sent to {group.audience.toLowerCase()}s
              </h3>
              <ul className="space-y-0.5">
                {group.templates.map((t) => (
                  <li key={t.type}>
                    <button
                      type="button"
                      onClick={() => select(t)}
                      aria-current={t.type === selectedType}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                        t.type === selectedType
                          ? "bg-primary/10 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                      }`}
                    >
                      <span>{LABELS[t.type] ?? t.type}</span>
                      {t.customized && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">Custom</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {selected && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div>
              <h2 className="text-lg font-semibold text-white">{LABELS[selected.type] ?? selected.type}</h2>
              <p className="text-sm text-zinc-500">Sent to {selected.audience.toLowerCase()}s</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-subject">Subject</Label>
              <Input id="email-subject" maxLength={255} {...fieldProps("subject")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-heading">Heading</Label>
              <Input id="email-heading" maxLength={255} {...fieldProps("heading")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-message">Message</Label>
              <textarea
                id="email-message"
                rows={9}
                maxLength={5000}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                {...fieldProps("message")}
              />
              <p className="text-xs text-zinc-500">Leave a blank line between paragraphs. The greeting and details box are added automatically.</p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-zinc-400">Insert placeholder</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.placeholders.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertPlaceholder(key)}
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-300 hover:border-primary hover:text-primary"
                  >
                    {`{{${key}}}`}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {notice && <p className="text-sm text-primary">{notice}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                disabled={busy !== null || !dirty}
                onClick={handleSave}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {busy === "save" && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
              <Button type="button" variant="outline" disabled={busy !== null} onClick={handleTest}>
                {busy === "test" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send test to me
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null || !selected.customized}
                onClick={handleReset}
              >
                {busy === "reset" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                Reset to default
              </Button>
            </div>
          </section>

          <section aria-label="Inbox preview" className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Inbox preview · sample data</p>
                <p className="truncate text-sm font-semibold text-white">{preview?.subject ?? " "}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {previewing && <Loader2 className="mr-1 size-4 animate-spin text-zinc-500" aria-label="Updating preview" />}
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
              </div>
            </div>
            <div className="flex justify-center bg-[#0a0c0b]">
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={preview?.html ?? ""}
                className="h-[640px] border-0 transition-[width]"
                style={{ width: mobile ? 375 : "100%" }}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
