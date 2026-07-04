"use client"

import { useState, useRef } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ApplyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobTitle: string
  jobId: number | null
}

export function ApplyModal({
  open,
  onOpenChange,
  jobTitle,
  jobId,
}: ApplyModalProps) {
  const [fullname, setFullname] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [github, setGithub] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCEPT_TYPES = ".pdf,.doc,.docx"
  const isValidFile = (file: File) => {
    const valid = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    return valid.some((t) => file.type === t) || /\.(pdf|doc|docx)$/i.test(file.name)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && isValidFile(file)) setCvFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (jobId == null) {
      setSubmitError("Job not found. Please try again from the job listing.")
      return
    }
    setSubmitError("")
    setSubmitting(true)
    try {
      const githubUrl = github.trim()
        ? github.trim().startsWith("http")
          ? github.trim()
          : `https://github.com/${github.trim()}`
        : ""
      if (!cvFile) {
        setSubmitError("Resume is required.")
        setSubmitting(false)
        return
      }
      const formData = new FormData()
      formData.set("fullName", fullname.trim())
      formData.set("email", email.trim())
      if (phone.trim()) {
        formData.set("phoneNumber", phone.trim())
      }
      if (githubUrl) {
        formData.set("githubUrl", githubUrl)
      }
      formData.set("resume", cvFile)

      const res = await fetch(`/api/jobs/${jobId}/apply/form`, {
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
      setFullname("")
      setEmail("")
      setPhone("")
      setGithub("")
      setCvFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
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
      setFullname("")
      setEmail("")
      setPhone("")
      setGithub("")
      setCvFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setSubmitted(false)
      setSubmitError("")
    }
    onOpenChange(next)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/50 bg-card p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-foreground">
              Apply for {jobTitle}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          {submitted ? (
            <div className="py-8 text-center">
              <p className="text-lg font-medium text-primary mb-2">
                Application submitted
              </p>
              <p className="text-muted-foreground text-sm">
                We&apos;ll be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apply-fullname">Full name</Label>
                <Input
                  id="apply-fullname"
                  type="text"
                  placeholder="Your full name"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-email">Email</Label>
                <Input
                  id="apply-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-phone">Phone number</Label>
                <Input
                  id="apply-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full"
                />
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
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-cv">
                  CV / Resume <span className="text-muted-foreground">(required)</span>
                </Label>
                <input
                  ref={fileInputRef}
                  id="apply-cv"
                  type="file"
                  accept={ACCEPT_TYPES}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && isValidFile(file)) setCvFile(file)
                  }}
                  aria-label="Upload CV or resume"
                />
                <div
                  role="button"
                  tabIndex={0}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  className={`
                    relative flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6
                    transition-colors cursor-pointer
                    ${isDragActive
                      ? "border-primary bg-primary/10"
                      : cvFile
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    }
                  `}
                  aria-label="Drop CV here or click to browse"
                >
                  {cvFile ? (
                    <>
                      <FileText className="size-10 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate max-w-full px-2">
                        {cvFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Click or drop a new file to replace
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className={`size-10 shrink-0 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium text-center ${isDragActive ? "text-primary" : "text-muted-foreground"}`}>
                        {isDragActive ? "Drop your CV here" : "Drag and drop your CV here"}
                      </span>
                      <span className="text-xs text-muted-foreground text-center">
                        or click to choose from device — PDF or Word, max 10MB
                      </span>
                    </>
                  )}
                </div>
              </div>
              {submitError && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
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
