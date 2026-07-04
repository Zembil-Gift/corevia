import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, MapPin } from "lucide-react"
import Image from "next/image"
import { fetchJobBySlug, formatJobEmploymentType } from "@/lib/jobs-api"
import { Footer } from "@/components/afrodebab/footer"
import { JobDetailApply } from "@/components/jobs/job-detail-apply"

interface JobDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const job = await fetchJobBySlug(slug)
  if (!job || job.status !== "OPEN") return { title: "Job not found" }
  return {
    title: `${job.title} | AfroDebab Jobs`,
    description: job.description,
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params
  const job = await fetchJobBySlug(slug)

  if (!job || job.status !== "OPEN") {
    notFound()
  }

  return (
    <div className="min-h-screen w-full relative bg-background">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(74, 148, 115, 0.08), transparent 60%)",
        }}
      />

      <header className="sticky top-4 z-[9999] mx-auto flex w-full flex-row items-center justify-between rounded-full bg-background/90 backdrop-blur-md border border-border/50 shadow-lg max-w-5xl px-4 py-2 mt-4">
        <Link
          className="flex items-center justify-center gap-3"
          href="/"
        >
          <Image
            src="/afrodebab-logo.png"
            alt="AfroDebab"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-semibold text-foreground tracking-tight">
            AfroDebab
          </span>
        </Link>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Jobs
        </Link>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-16">
        <article>
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/15 text-primary">
                {job.department}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                {formatJobEmploymentType(job.employmentType)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4" />
                {job.location}
              </span>
            </div>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              About the role
            </h2>
            <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          <JobDetailApply jobTitle={job.title} jobId={job.id} />
        </article>
      </main>

      <Footer />
    </div>
  )
}
