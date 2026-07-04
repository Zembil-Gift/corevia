"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { JobApi, JobEmploymentTypeApi, JobStatusApi } from "@/lib/jobs-api"
import { JOB_EMPLOYMENT_TYPES, formatJobEmploymentType } from "@/lib/jobs-api"

const STATUS_OPTIONS: JobStatusApi[] = ["DRAFT", "OPEN", "CLOSED"]

interface EditJobModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  job: JobApi | null
}

export function EditJobModal({
  open,
  onOpenChange,
  onSuccess,
  job,
}: EditJobModalProps) {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [department, setDepartment] = useState("")
  const [employmentType, setEmploymentType] = useState<JobEmploymentTypeApi>("FULL_TIME")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<JobStatusApi>("DRAFT")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (job && open) {
      setTitle(job.title ?? "")
      setSlug(job.slug ?? "")
      setDepartment(job.department ?? "")
      setEmploymentType(job.employmentType ?? "FULL_TIME")
      setLocation(job.location ?? "")
      setDescription(job.description ?? "")
      setStatus(job.status ?? "DRAFT")
      setError("")
    }
  }, [job, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          department: department.trim(),
          employmentType,
          location: location.trim(),
          description: description.trim(),
          status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to update job")
        setSubmitting(false)
        return
      }
      onOpenChange(false)
      onSuccess?.()
    } catch {
      setError("Something went wrong")
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
          className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-white">
              Edit job
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
              <Label htmlFor="edit-job-title" className="text-zinc-200">Title</Label>
              <Input
                id="edit-job-title"
                type="text"
                placeholder="Job title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job-slug" className="text-zinc-200">Slug</Label>
              <Input
                id="edit-job-slug"
                type="text"
                placeholder="job-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job-department" className="text-zinc-200">Department</Label>
              <Input
                id="edit-job-department"
                type="text"
                placeholder="e.g. Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job-employment-type" className="text-zinc-200">Employment type</Label>
              <select
                id="edit-job-employment-type"
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
              <Label htmlFor="edit-job-location" className="text-zinc-200">Location</Label>
              <Input
                id="edit-job-location"
                type="text"
                placeholder="e.g. Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job-description" className="text-zinc-200">Description</Label>
              <textarea
                id="edit-job-description"
                rows={4}
                placeholder="Job description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20 resize-y min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job-status" className="text-zinc-200">Status</Label>
              <select
                id="edit-job-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatusApi)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
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
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
