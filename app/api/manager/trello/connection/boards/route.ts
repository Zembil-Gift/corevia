import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// Save the manager's selected boards (replaces their previous selection wholesale).
export async function PUT(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const res = await fetch(`${CMS_BASE_URL}/manager/trello/connection/boards`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to save boards" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Trello save-boards proxy error:", err)
    return NextResponse.json({ error: "Failed to reach Trello service" }, { status: 500 })
  }
}
