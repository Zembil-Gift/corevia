import { NextRequest, NextResponse } from "next/server"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ATTENDANCE_GEOFENCE_LAT = Number(process.env.APP_ATTENDANCE_GEOFENCE_LAT)
const ATTENDANCE_GEOFENCE_LNG = Number(process.env.APP_ATTENDANCE_GEOFENCE_LNG)

const MAX_DISTANCE_METERS = 500

const toRadians = (value: number) => (value * Math.PI) / 180

const distanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const earthRadius = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

export async function POST(request: NextRequest) {
  if (!Number.isFinite(ATTENDANCE_GEOFENCE_LAT) || !Number.isFinite(ATTENDANCE_GEOFENCE_LNG)) {
    return NextResponse.json({ error: "Attendance location is not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action, email, lat, lng } = body

    if (!action || !["clockIn", "clockOut", "lunchBreakIn", "lunchBreakOut"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const latitude = typeof lat === "number" ? lat : Number(lat)
    const longitude = typeof lng === "number" ? lng : Number(lng)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 })
    }

    const distance = distanceMeters(
      latitude,
      longitude,
      ATTENDANCE_GEOFENCE_LAT,
      ATTENDANCE_GEOFENCE_LNG
    )

    if (distance > MAX_DISTANCE_METERS) {
      return NextResponse.json(
        { error: "You are outside the allowed attendance area" },
        { status: 403 }
      )
    }

    const endpoint =
      action === "clockIn"
        ? "/employee/me/clock-in"
        : action === "clockOut"
          ? "/employee/me/clock-out"
          : action === "lunchBreakIn"
            ? "/employee/me/lunch-break-in"
            : "/employee/me/lunch-break-out"

    const res = await fetch(`${CMS_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim() }),
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