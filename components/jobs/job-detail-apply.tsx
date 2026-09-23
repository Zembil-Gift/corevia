"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApplyModal } from "@/components/jobs/apply-modal"
import type { ApplicationField } from "@/lib/jobs-api"

interface JobDetailApplyProps {
  jobTitle: string
  jobId: number
  orgSlug?: string
  allJobsHref?: string
  fields?: ApplicationField[]
}

export function JobDetailApply({ jobTitle, jobId, orgSlug, allJobsHref = "/jobs", fields }: JobDetailApplyProps) {
  const [applyModalOpen, setApplyModalOpen] = useState(false)

  return (
    <div className="mt-12 pt-8 border-t border-border/50 flex justify-between items-center">
      <ApplyModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        jobTitle={jobTitle}
        jobId={jobId}
        orgSlug={orgSlug}
        fields={fields}
      />
      <Link
        href={allJobsHref}
        className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
      >
        <ArrowLeft className="size-4" />
        View all open roles
      </Link>
      <Button
        size="lg"
        className="rounded-full mb-6"
        onClick={() => setApplyModalOpen(true)}
      >
        Apply
      </Button>
    </div>
  )
}
