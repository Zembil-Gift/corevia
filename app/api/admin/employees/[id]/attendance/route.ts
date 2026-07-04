import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const res = await fetch(`${CMS_BASE_URL}/manager/employees/${id}/attendance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch attendance" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Get attendance error:", err)
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
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

  try {
    const body = await request.json()
    const payload = {
      date: typeof body.date === "string" ? body.date : "",
      clockInAt: typeof body.clockInAt === "string" ? body.clockInAt : "",
      clockOutAt: typeof body.clockOutAt === "string" ? body.clockOutAt : "",
      lunchBreakInAt:
        typeof body.lunchBreakInAt === "string" ? body.lunchBreakInAt : body.lunchBreakInAt === null ? null : null,
      lunchBreakOutAt:
        typeof body.lunchBreakOutAt === "string"
          ? body.lunchBreakOutAt
          : body.lunchBreakOutAt === null
            ? null
            : null,
    }

    const res = await fetch(`${CMS_BASE_URL}/manager/employees/${id}/attendance`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to update attendance" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Update attendance error:", err)
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
  }
}