import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// Save the manager's selected GitHub orgs (replaces their previous selection wholesale).
export async function PUT(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const res = await fetch(`${CMS_BASE_URL}/manager/github/connection/orgs`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to save orgs" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("GitHub save-orgs proxy error:", err)
    return NextResponse.json({ error: "Failed to reach GitHub service" }, { status: 500 })
  }
}
