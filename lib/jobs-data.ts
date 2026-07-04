export type EmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "intern"

export type JobStatus = "draft" | "open" | "closed"

export interface Job {
  id: string
  title: string
  slug: string
  department: string
  employment_type: EmploymentType
  location: string
  description: string
  status: JobStatus
  created_at: string
  updated_at: string
}

export const JOBS: Job[] = [
  {
    id: "job-1",
    title: "Senior Flutter Developer",
    slug: "senior-flutter-developer",
    department: "Engineering",
    employment_type: "full-time",
    location: "Remote (US / East Africa)",
    description:
      "We're looking for a Senior Flutter Developer to lead mobile app development for our flagship product, goGerami. You'll work with Dart/Flutter daily, collaborate with product and design, and help shape our mobile architecture. Experience with offline-first apps and REST/GraphQL APIs is a plus.",
    status: "open",
    created_at: "2025-01-15T10:00:00",
    updated_at: "2025-01-15T10:00:00",
  },
  {
    id: "job-2",
    title: "Full-Stack Engineer (Next.js)",
    slug: "full-stack-engineer-nextjs",
    department: "Engineering",
    employment_type: "full-time",
    location: "Remote",
    description:
      "Join our web team to build and maintain our Next.js applications, internal tools, and APIs. You'll work with TypeScript, React, and Node.js. Experience with Vercel, Prisma, or similar is helpful. We value clean code, accessibility, and performance.",
    status: "open",
    created_at: "2025-01-12T09:00:00",
    updated_at: "2025-01-12T09:00:00",
  },
  {
    id: "job-3",
    title: "Product Designer",
    slug: "product-designer",
    department: "Design",
    employment_type: "full-time",
    location: "Remote (Africa or US)",
    description:
      "We need a Product Designer to own UX/UI for our products. You'll create flows, wireframes, and high-fidelity designs; work closely with engineering; and help establish our design system. Experience with Figma and designing for emerging markets is ideal.",
    status: "open",
    created_at: "2025-01-10T14:00:00",
    updated_at: "2025-01-10T14:00:00",
  },
  {
    id: "job-4",
    title: "DevOps / Platform Engineer",
    slug: "devops-platform-engineer",
    department: "Engineering",
    employment_type: "contract",
    location: "Remote",
    description:
      "Contract role to help us scale infrastructure: CI/CD, cloud (AWS/GCP), monitoring, and security. You'll work with the engineering team to improve deployment and reliability. Experience with Docker, Kubernetes, or Terraform is a plus.",
    status: "open",
    created_at: "2025-01-08T11:00:00",
    updated_at: "2025-01-08T11:00:00",
  },
  {
    id: "job-5",
    title: "Marketing & Growth Lead",
    slug: "marketing-growth-lead",
    department: "Marketing",
    employment_type: "full-time",
    location: "Remote",
    description:
      "Lead our marketing and growth efforts for Pan-African and diaspora audiences. You'll own content, campaigns, partnerships, and analytics. Experience with tech startups and African markets is highly valued.",
    status: "open",
    created_at: "2025-01-05T08:00:00",
    updated_at: "2025-01-05T08:00:00",
  },
  {
    id: "job-6",
    title: "Software Engineering Intern",
    slug: "software-engineering-intern",
    department: "Engineering",
    employment_type: "intern",
    location: "Remote",
    description:
      "Paid internship for someone eager to learn Flutter, Next.js, or backend development. You'll pair with senior engineers, ship real features, and get mentorship. Open to students and career switchers with basic programming experience.",
    status: "open",
    created_at: "2025-01-02T12:00:00",
    updated_at: "2025-01-02T12:00:00",
  },
  {
    id: "job-7",
    title: "Part-Time Content Writer",
    slug: "part-time-content-writer",
    department: "Marketing",
    employment_type: "part-time",
    location: "Remote",
    description:
      "Part-time role to create blog posts, docs, and marketing copy for AfroDebab and goGerami. You'll work with the marketing lead on tone, SEO, and storytelling. Strong writing in English required; familiarity with African tech is a plus.",
    status: "open",
    created_at: "2024-12-28T10:00:00",
    updated_at: "2024-12-28T10:00:00",
  },
  {
    id: "job-8",
    title: "Backend Engineer (Node.js)",
    slug: "backend-engineer-nodejs",
    department: "Engineering",
    employment_type: "full-time",
    location: "Remote",
    description:
      "Build and maintain APIs and services powering our products. You'll work with Node.js, TypeScript, and databases (PostgreSQL/MongoDB). Experience with auth, payments, or mobile backends is helpful.",
    status: "open",
    created_at: "2024-12-22T09:00:00",
    updated_at: "2024-12-22T09:00:00",
  },
]

export const JOBS_PER_PAGE = 6

export function getOpenJobs(): Job[] {
  return JOBS.filter((j) => j.status === "open")
}

export function getPaginatedJobs(page: number): Job[] {
  const open = getOpenJobs()
  const start = (page - 1) * JOBS_PER_PAGE
  return open.slice(start, start + JOBS_PER_PAGE)
}

export function getJobsTotalPages(): number {
  const open = getOpenJobs()
  return Math.ceil(open.length / JOBS_PER_PAGE)
}

export function getJobBySlug(slug: string): Job | undefined {
  return JOBS.find((j) => j.slug === slug && j.status === "open")
}

export function formatEmploymentType(type: EmploymentType): string {
  const labels: Record<EmploymentType, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    intern: "Intern",
  }
  return labels[type]
}

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  "full-time",
  "part-time",
  "contract",
  "intern",
]

export function filterJobs(
  jobs: Job[],
  searchQuery: string,
  employmentTypeFilter: EmploymentType | null
): Job[] {
  let result = jobs
  if (employmentTypeFilter) {
    result = result.filter((j) => j.employment_type === employmentTypeFilter)
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
