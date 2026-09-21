import { NextRequest, NextResponse } from "next/server"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, lat, lng } = body

    if (!action || !["clockIn", "clockOut", "lunchBreakIn", "lunchBreakOut"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const latitude = typeof lat === "number" ? lat : (lat ? Number(lat) : null)
    const longitude = typeof lng === "number" ? lng : (lng ? Number(lng) : null)

    const endpoint =
      action === "clockIn"
        ? "/employee/me/clock-in"
        : action === "clockOut"
          ? "/employee/me/clock-out"
          : action === "lunchBreakIn"
            ? "/employee/me/lunch-break-in"
            : "/employee/me/lunch-break-out"

    const payload: { email: string; latitude?: number | null; longitude?: number | null } = {
      email: email.trim(),
    }
    if (latitude !== null && Number.isFinite(latitude)) {
      payload.latitude = latitude
    }
    if (longitude !== null && Number.isFinite(longitude)) {
      payload.longitude = longitude
    }

    const res = await fetch(`${CMS_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to record attendance" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Clock attendance error:", err)
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 })
  }
}