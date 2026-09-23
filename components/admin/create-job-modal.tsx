"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLang, pick } from "@/lib/i18n"
import { a } from "@/lib/i18n-admin"
import type { JobEmploymentTypeApi, JobStatusApi } from "@/lib/jobs-api"
import { EXPERIENCE_LEVELS, JOB_EMPLOYMENT_TYPES, formatJobEmploymentType, type ApplicationField } from "@/lib/jobs-api"
import { ApplicationFieldsBuilder, validateApplicationFields } from "@/components/admin/application-fields-builder"

const STATUS_OPTIONS: JobStatusApi[] = ["DRAFT", "OPEN", "CLOSED"]

const c = {
  createJob: { en: "Create job", am: "ስራ ፍጠር" },
  titlePlaceholder: { en: "Job title", am: "የስራ ርዕስ" },
  deptPlaceholder: { en: "e.g. Engineering", am: "ለምሳሌ ኢንጂነሪንግ" },
  locationPlaceholder: { en: "e.g. Remote", am: "ለምሳሌ ከርቀት" },
  descPlaceholder: { en: "Job description...", am: "የስራ መግለጫ..." },
  failed: { en: "Failed to create job", am: "ስራ መፍጠር አልተሳካም" },
}

interface CreateJobModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateJobModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateJobModalProps) {
  const { lang } = useLang()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [department, setDepartment] = useState("")
  const [employmentType, setEmploymentType] = useState<JobEmploymentTypeApi>("FULL_TIME")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<JobStatusApi>("DRAFT")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [salaryRange, setSalaryRange] = useState("")
  const [applicationDeadline, setApplicationDeadline] = useState("")
  const [applicationFields, setApplicationFields] = useState<ApplicationField[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const fieldsError = validateApplicationFields(applicationFields)
    if (fieldsError) {
      setError(fieldsError)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          department: department.trim(),
          employmentType,
          location: location.trim(),
          description: description.trim(),
          status,
          experienceLevel: experienceLevel || null,
          salaryRange: salaryRange.trim() || null,
          applicationDeadline: applicationDeadline || null,
          applicationFields: applicationFields.map((f) => ({
            ...f,
            label: f.label.trim(),
            helpText: f.helpText?.trim() || null,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? pick(lang, c.failed))
        setSubmitting(false)
        return
      }
      setTitle("")
      setSlug("")
      setDepartment("")
      setEmploymentType("FULL_TIME")
      setLocation("")
      setDescription("")
      setStatus("DRAFT")
      setExperienceLevel("")
      setSalaryRange("")
      setApplicationDeadline("")
      setApplicationFields([])
      onOpenChange(false)
      onSuccess?.()
    } catch {
      setError(pick(lang, a.somethingWrong))
    }
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !submitting) setError("")
    onOpenChange(next)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-white">
              {pick(lang, c.createJob)}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-title" className="text-zinc-200">{pick(lang, a.title)}</Label>
              <Input
                id="job-title"
                type="text"
                placeholder={pick(lang, c.titlePlaceholder)}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-slug" className="text-zinc-200">{pick(lang, a.slug)}</Label>
              <Input
                id="job-slug"
                type="text"
                placeholder="job-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-department" className="text-zinc-200">{pick(lang, a.department)}</Label>
              <Input
                id="job-department"
                type="text"
                placeholder={pick(lang, c.deptPlaceholder)}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-employment-type" className="text-zinc-200">{pick(lang, a.employmentType)}</Label>
              <select
                id="job-employment-type"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as JobEmploymentTypeApi)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20"
              >
                {JOB_EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{formatJobEmploymentType(t)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-location" className="text-zinc-200">{pick(lang, a.location)}</Label>
              <Input
                id="job-location"
                type="text"
                placeholder={pick(lang, c.locationPlaceholder)}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description" className="text-zinc-200">{pick(lang, a.description)}</Label>
              <textarea
                id="job-description"
                required
                rows={4}
                placeholder={pick(lang, c.descPlaceholder)}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20 resize-y min-h-[100px]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-experience" className="text-zinc-200">Experience level</Label>
                <select
                  id="job-experience"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20"
                >
                  <option value="">Not specified</option>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-salary" className="text-zinc-200">Salary range <span className="text-zinc-500">(optional)</span></Label>
                <Input
                  id="job-salary"
                  type="text"
                  placeholder="e.g. ETB 30,000 – 45,000 / month"
                  maxLength={120}
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-deadline" className="text-zinc-200">Application deadline <span className="text-zinc-500">(optional, last day to apply)</span></Label>
              <Input
                id="job-deadline"
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white [color-scheme:dark]"
              />
            </div>
            <ApplicationFieldsBuilder value={applicationFields} onChange={setApplicationFields} />
            <div className="space-y-2">
              <Label htmlFor="job-status" className="text-zinc-200">{pick(lang, a.status)}</Label>
              <select
                id="job-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatusApi)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {pick(lang, s === "DRAFT" ? a.draft : s === "OPEN" ? a.open : a.closed)}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {pick(lang, a.creating)}
                  </>
                ) : (
                  pick(lang, c.createJob)
                )}
              </Button>
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  {pick(lang, a.cancel)}
                </Button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
