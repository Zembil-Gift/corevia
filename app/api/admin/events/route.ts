import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

const VALID_EVENT_TYPES = ["ONLINE", "IN_PERSON"] as const
const VALID_STATUSES = ["DRAFT", "PUBLISHED"] as const

function normalizeEventType(v: unknown): (typeof VALID_EVENT_TYPES)[number] {
  if (typeof v === "string" && VALID_EVENT_TYPES.includes(v as (typeof VALID_EVENT_TYPES)[number])) {
    return v as (typeof VALID_EVENT_TYPES)[number]
  }
  return "ONLINE"
}

function normalizeStatus(v: unknown): (typeof VALID_STATUSES)[number] {
  if (typeof v === "string" && VALID_STATUSES.includes(v as (typeof VALID_STATUSES)[number])) {
    return v as (typeof VALID_STATUSES)[number]
  }
  return "DRAFT"
}

// Tenant-scoped list of the logged-in manager's own events (all statuses).
export async function GET(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const qs = request.nextUrl.searchParams.toString()
    const res = await fetch(`${CMS_BASE_URL}/manager/events${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch events" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin list events error:", err)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
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
      description: typeof body.description === "string" ? body.description : "",
      eventType: normalizeEventType(body.eventType),
      location: typeof body.location === "string" ? body.location : "",
      startDate: typeof body.startDate === "string" ? body.startDate : "",
      endDate: typeof body.endDate === "string" ? body.endDate : "",
      registrationUrl: typeof body.registrationUrl === "string" ? body.registrationUrl : "",
      coverImageUrl: typeof body.coverImageUrl === "string" ? body.coverImageUrl : "",
      status: normalizeStatus(body.status),
    }

    const res = await fetch(`${CMS_BASE_URL}/manager/events`, {
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
        { error: (data as { message?: string }).message ?? "Failed to create event" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin create event error:", err)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}
