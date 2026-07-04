import { NextRequest, NextResponse } from "next/server"
import { getPlatformToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
  const token = getPlatformToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const res = await fetch(`${CMS_BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to load platform stats" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Platform stats error:", err)
    return NextResponse.json({ error: "Failed to load platform stats" }, { status: 500 })
  }
}
