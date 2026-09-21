import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// Live list of the manager's GitHub orgs (fetched from GitHub with their stored token).
export async function GET(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/github/connection/available-orgs`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to load GitHub orgs" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("GitHub available-orgs proxy error:", err)
    return NextResponse.json({ error: "Failed to reach GitHub service" }, { status: 500 })
  }
}
