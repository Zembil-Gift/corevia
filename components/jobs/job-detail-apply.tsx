"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApplyModal } from "@/components/jobs/apply-modal"

interface JobDetailApplyProps {
  jobTitle: string
  jobId: number
}

export function JobDetailApply({ jobTitle, jobId }: JobDetailApplyProps) {
  const [applyModalOpen, setApplyModalOpen] = useState(false)

  return (
    <div className="mt-12 pt-8 border-t border-border/50 flex justify-between items-center">
      <ApplyModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        jobTitle={jobTitle}
        jobId={jobId}
      />
      <Link
        href="/jobs"
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
