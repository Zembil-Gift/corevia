"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react"
import {
  formatJobEmploymentType,
  JOB_EMPLOYMENT_TYPES,
  type JobApi,
  type JobEmploymentTypeApi,
} from "@/lib/jobs-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Footer } from "@/components/afrodebab/footer"
import { ApplyModal } from "@/components/jobs/apply-modal"

const JOBS_PER_PAGE = 6
const FETCH_SIZE = 100

function filterJobs(
  jobs: JobApi[],
  searchQuery: string,
  employmentFilter: JobEmploymentTypeApi | null
): JobApi[] {
  let result = jobs.filter((j) => j.status === "OPEN")
  if (employmentFilter) {
    result = result.filter((j) => j.employmentType === employmentFilter)
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    result = result.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    )
  }
  return result
}

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [employmentFilter, setEmploymentFilter] =
    useState<JobEmploymentTypeApi | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobApi | null>(null)
  const [jobs, setJobs] = useState<JobApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/jobs?page=0&size=${FETCH_SIZE}&sortBy=title&direction=asc`
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to load jobs: ${res.status}`)
      }
      const data = await res.json()
      setJobs(data.content ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const filteredJobs = useMemo(
    () => filterJobs(jobs, searchQuery, employmentFilter),
    [jobs, searchQuery, employmentFilter]
  )
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE))
  const start = (currentPage - 1) * JOBS_PER_PAGE
  const paginatedJobs = useMemo(
    () => filteredJobs.slice(start, start + JOBS_PER_PAGE),
    [filteredJobs, start]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, employmentFilter])

  const openApplyModal = (job: JobApi) => {
    setSelectedJob(job)
    setApplyModalOpen(true)
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
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Home
        </Link>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
            Jobs
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join us. We&apos;re building Pan-African technology products and a team
            that spans the diaspora and the continent.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-xl mx-auto mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search by title, department, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 rounded-full bg-card border-border/50"
            aria-label="Search jobs"
          />
        </div>

        {/* Employment type chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setEmploymentFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              employmentFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All
          </button>
          {JOB_EMPLOYMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setEmploymentFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                employmentFilter === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {formatJobEmploymentType(type)}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 text-sm mb-8 text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading jobs…</p>
          </div>
        ) : paginatedJobs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No jobs match your search. Try a different query or filter.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {paginatedJobs.map((job) => (
                <article
                  key={job.id}
                  className="group flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
                        {job.department}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {formatJobEmploymentType(job.employmentType)}
                      </span>
                    </div>
                    <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {job.title}
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base line-clamp-3 flex-1 mb-4">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="size-4 shrink-0 text-primary/70" />
                      <span className="line-clamp-1">{job.location}</span>
                    </div>

                    <div className="flex justify-between items-center w-full">
                      <div className="flex-1">
                        <Link
                          href={`/jobs/${job.slug}`}
                          className="inline-flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all"
                        >
                          View role
                          <ArrowRight className="size-4 shrink-0" />
                        </Link>
                      </div>
                      <div className="flex-1 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => openApplyModal(job)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-2 mt-12 md:mt-16"
                aria-label="Jobs pagination"
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="rounded-full"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="flex items-center gap-1 px-4 text-sm text-muted-foreground">
                  Page{" "}
                  <span className="font-medium text-foreground">{currentPage}</span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="rounded-full"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </nav>
            )}
          </>
        )}
      </main>

      <ApplyModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        jobTitle={selectedJob?.title ?? ""}
        jobId={selectedJob?.id ?? null}
      />

      <Footer />
    </div>
  )
}
