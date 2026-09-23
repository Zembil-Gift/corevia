import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

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
    return NextResponse.json({ error: "Missing event id" }, { status: 400 })
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

    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/events/${encodeURIComponent(id)}`, {
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
        { error: (data as { message?: string }).message ?? "Failed to update event" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin update event error:", err)
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    )
  }
}
