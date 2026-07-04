import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

const VALID_EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"] as const
const VALID_STATUSES = ["DRAFT", "OPEN", "CLOSED"] as const

function normalizeEmploymentType(v: unknown): (typeof VALID_EMPLOYMENT_TYPES)[number] {
  if (typeof v === "string" && VALID_EMPLOYMENT_TYPES.includes(v as (typeof VALID_EMPLOYMENT_TYPES)[number])) {
    return v as (typeof VALID_EMPLOYMENT_TYPES)[number]
  }
  return "FULL_TIME"
}

function normalizeStatus(v: unknown): (typeof VALID_STATUSES)[number] {
  if (typeof v === "string" && VALID_STATUSES.includes(v as (typeof VALID_STATUSES)[number])) {
    return v as (typeof VALID_STATUSES)[number]
  }
  return "DRAFT"
}

// Tenant-scoped list of the logged-in manager's own jobs (all statuses).
export async function GET(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const qs = request.nextUrl.searchParams.toString()
    const res = await fetch(`${CMS_BASE_URL}/manager/jobs${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch jobs" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin list jobs error:", err)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = {
      title: typeof body.title === "string" ? body.title : "",
      slug: typeof body.slug === "string" ? body.slug : "",
      department: typeof body.department === "string" ? body.department : "",
      employmentType: normalizeEmploymentType(body.employmentType),
      location: typeof body.location === "string" ? body.location : "",
      description: typeof body.description === "string" ? body.description : "",
      status: normalizeStatus(body.status),
    }

    const res = await fetch(`${CMS_BASE_URL}/manager/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to create job" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin create job error:", err)
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    )
  }
}
