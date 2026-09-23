"use client"

import { useState, useRef } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  APPLICATION_FILE_TYPES,
  DEFAULT_TEXT_ANSWER_LENGTH,
  MAX_APPLICATION_FILE_BYTES,
  acceptFor,
  fileMatchesTypes,
  isEthiopianPhone,
  isHttpUrl,
  type ApplicationField,
  type ApplicationFileType,
} from "@/lib/jobs-api"

interface ApplyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobTitle: string
  jobId: number | null
  /** Organization whose job this is; omitted on this site's own /jobs pages. */
  orgSlug?: string
  /** Extra questions the manager added to this job's application form. */
  fields?: ApplicationField[]
}

const RESUME_TYPES: ApplicationFileType[] = ["PDF", "DOC", "DOCX"]

/** Shared drag-and-drop file picker for the CV and any file fields. */
function FileDrop({
  id,
  file,
  accept,
  hint,
  invalid,
  onFile,
}: {
  id: string
  file: File | null
  accept: string
  hint: string
  invalid: boolean
  onFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ""
        }}
      />
      <div
        role="button"
        tabIndex={0}
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          const f = e.dataTransfer.files?.[0]
          if (f) onFile(f)
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className={`relative flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-4 transition-colors ${
          dragActive
            ? "border-primary bg-primary/10"
            : invalid
              ? "border-destructive/60 bg-destructive/5"
              : file
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        {file ? (
          <>
            <FileText className="size-8 shrink-0 text-primary" />
            <span className="max-w-full truncate px-2 text-sm font-medium text-foreground">{file.name}</span>
            <span className="text-xs text-muted-foreground">Click or drop a new file to replace</span>
          </>
        ) : (
          <>
            <Upload className={`size-8 shrink-0 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-center text-sm font-medium text-muted-foreground">
              {dragActive ? "Drop the file here" : "Drag and drop, or click to choose"}
            </span>
          </>
        )}
        <span id={`${id}-hint`} className="text-center text-xs text-muted-foreground">{hint}</span>
      </div>
    </>
  )
}

function typesHint(types: ApplicationFileType[]) {
  return `${types.map((t) => APPLICATION_FILE_TYPES[t].label).join(", ")} · max 10 MB`
}

function fileError(file: File, types: ApplicationFileType[]): string | null {
  if (!fileMatchesTypes(file, types)) return `Allowed: ${types.map((t) => APPLICATION_FILE_TYPES[t].label).join(", ")}`
  if (file.size > MAX_APPLICATION_FILE_BYTES) return "File must be 10 MB or smaller"
  return null
}

export function ApplyModal({
  open,
  onOpenChange,
  jobTitle,
  jobId,
  orgSlug,
  fields = [],
}: ApplyModalProps) {
  const [fullname, setFullname] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [github, setGithub] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const reset = () => {
    setFullname("")
    setEmail("")
    setPhone("")
    setGithub("")
    setCvFile(null)
    setAnswers({})
    setFiles({})
    setErrors({})
    setSubmitError("")
  }

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })

  const pickFile = (key: string, file: File, types: ApplicationFileType[], set: (f: File) => void) => {
    const err = fileError(file, types)
    if (err) {
      setErrors((prev) => ({ ...prev, [key]: err }))
      return
    }
    clearError(key)
    set(file)
  }

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!fullname.trim()) e.fullname = "Full name is required"
    if (!email.trim()) e.email = "Email is required"
    if (!phone.trim()) e.phone = "Phone number is required"
    else if (!isEthiopianPhone(phone)) e.phone = "Enter an Ethiopian number, e.g. 0911 234 567 or +251 911 234 567"
    if (!cvFile) e.cv = "CV / resume is required"
    for (const f of fields) {
      const key = `field-${f.id}`
      if (f.type === "FILE") {
        if (!files[f.id] && f.required) e[key] = "This file is required"
        continue
      }
      const value = (answers[f.id] ?? "").trim()
      if (!value) {
        if (f.required) e[key] = "This field is required"
      } else if (f.type === "LINK" && !isHttpUrl(value)) {
        e[key] = "Enter a full link starting with https://"
      } else if (f.type === "TEXT" && value.length > (f.maxLength ?? DEFAULT_TEXT_ANSWER_LENGTH)) {
        e[key] = `Keep it under ${f.maxLength ?? DEFAULT_TEXT_ANSWER_LENGTH} characters`
      }
    }
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (jobId == null) {
      setSubmitError("Job not found. Please try again from the job listing.")
      return
    }
    setSubmitError("")
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setSubmitError("Please fix the highlighted fields.")
      document.getElementById(Object.keys(found)[0] === "cv" ? "apply-cv" : `apply-${Object.keys(found)[0]}`)?.focus()
      return
    }

    setSubmitting(true)
    try {
      const githubUrl = github.trim()
        ? github.trim().startsWith("http")
          ? github.trim()
          : `https://github.com/${github.trim()}`
        : ""
      const formData = new FormData()
      formData.set("fullName", fullname.trim())
      formData.set("email", email.trim())
      formData.set("phoneNumber", phone.trim())
      if (githubUrl) formData.set("githubUrl", githubUrl)
      formData.set("resume", cvFile!)
      for (const f of fields) {
        if (f.type === "FILE") {
          const file = files[f.id]
          if (file) formData.set(`file.${f.id}`, file)
        } else {
          const value = (answers[f.id] ?? "").trim()
          if (value) formData.set(`answer.${f.id}`, value)
        }
      }

      const res = await fetch(`/api/jobs/${jobId}/apply/form${orgSlug ? `?org=${encodeURIComponent(orgSlug)}` : ""}`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError((data as { error?: string }).error ?? "Failed to submit. Please try again.")
        setSubmitting(false)
        return
      }
      setSubmitted(true)
      reset()
      setTimeout(() => {
        onOpenChange(false)
        setSubmitted(false)
      }, 2000)
    } catch {
      setSubmitError("Something went wrong. Please try again.")
    }
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !submitting) {
      reset()
      setSubmitted(false)
    }
    onOpenChange(next)
  }

  const errorText = (key: string) =>
    errors[key] ? (
      <p id={`apply-${key}-error`} className="text-xs text-destructive">{errors[key]}</p>
    ) : null

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[10001] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/50 bg-card p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-foreground">
              Apply for {jobTitle}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          {submitted ? (
            <div className="py-8 text-center" role="status">
              <p className="mb-2 text-lg font-medium text-primary">Application submitted</p>
              <p className="text-sm text-muted-foreground">We&apos;ll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apply-fullname">Full name</Label>
                <Input
                  id="apply-fullname"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={fullname}
                  onChange={(e) => { setFullname(e.target.value); clearError("fullname") }}
                  aria-invalid={!!errors.fullname}
                  aria-describedby={errors.fullname ? "apply-fullname-error" : undefined}
                />
                {errorText("fullname")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-email">Email</Label>
                <Input
                  id="apply-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError("email") }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "apply-email-error" : undefined}
                />
                {errorText("email")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-phone">Phone number</Label>
                <Input
                  id="apply-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09XX XXX XXX or +251 9XX XXX XXX"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearError("phone") }}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "apply-phone-error" : undefined}
                />
                {errorText("phone")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-github">
                  GitHub <span className="text-muted-foreground">(URL or username, optional)</span>
                </Label>
                <Input
                  id="apply-github"
                  type="text"
                  placeholder="username or https://github.com/username"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-cv">
                  CV / Resume <span className="text-muted-foreground">(required)</span>
                </Label>
                <FileDrop
                  id="apply-cv"
                  file={cvFile}
                  accept={acceptFor(RESUME_TYPES)}
                  hint={typesHint(RESUME_TYPES)}
                  invalid={!!errors.cv}
                  onFile={(f) => pickFile("cv", f, RESUME_TYPES, setCvFile)}
                />
                {errorText("cv")}
              </div>

              {fields.length > 0 && (
                <div className="space-y-4 border-t border-border/50 pt-4">
                  {fields.map((f) => {
                    const key = `field-${f.id}`
                    const inputId = `apply-${key}`
                    const label = (
                      <Label htmlFor={inputId}>
                        {f.label}{" "}
                        <span className="text-muted-foreground">{f.required ? "(required)" : "(optional)"}</span>
                      </Label>
                    )
                    const help = f.helpText ? <p className="text-xs text-muted-foreground">{f.helpText}</p> : null
                    const describedBy = errors[key] ? `${inputId}-error` : undefined

                    if (f.type === "FILE") {
                      const types = f.fileTypes?.length ? f.fileTypes : RESUME_TYPES
                      return (
                        <div key={f.id} className="space-y-2">
                          {label}
                          {help}
                          <FileDrop
                            id={inputId}
                            file={files[f.id] ?? null}
                            accept={acceptFor(types)}
                            hint={typesHint(types)}
                            invalid={!!errors[key]}
                            onFile={(file) => pickFile(key, file, types, (ok) => setFiles((p) => ({ ...p, [f.id]: ok })))}
                          />
                          {errorText(key)}
                        </div>
                      )
                    }

                    if (f.type === "TEXT") {
                      const max = f.maxLength ?? DEFAULT_TEXT_ANSWER_LENGTH
                      const value = answers[f.id] ?? ""
                      return (
                        <div key={f.id} className="space-y-2">
                          {label}
                          {help}
                          <textarea
                            id={inputId}
                            rows={4}
                            maxLength={max}
                            value={value}
                            onChange={(e) => { setAnswers((p) => ({ ...p, [f.id]: e.target.value })); clearError(key) }}
                            aria-invalid={!!errors[key]}
                            aria-describedby={describedBy}
                            className="min-h-[96px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
                          />
                          <p className="text-right text-xs text-muted-foreground">{value.length} / {max}</p>
                          {errorText(key)}
                        </div>
                      )
                    }

                    return (
                      <div key={f.id} className="space-y-2">
                        {label}
                        {help}
                        <Input
                          id={inputId}
                          type="url"
                          inputMode="url"
                          placeholder="https://"
                          value={answers[f.id] ?? ""}
                          onChange={(e) => { setAnswers((p) => ({ ...p, [f.id]: e.target.value })); clearError(key) }}
                          aria-invalid={!!errors[key]}
                          aria-describedby={describedBy}
                        />
                        {errorText(key)}
                      </div>
                    )
                  })}
                </div>
              )}

              {submitError && (
                <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Sending…" : "Submit application"}
                </Button>
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Dialog.Close>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
