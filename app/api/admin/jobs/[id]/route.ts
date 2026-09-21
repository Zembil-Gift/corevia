import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 })
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
      subOrganizationId: typeof body.subOrganizationId === "number" ? body.subOrganizationId : null,
    }

    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/jobs/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to update job" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin update job error:", err)
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    )
  }
}
