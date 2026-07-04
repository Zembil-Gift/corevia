import { NextRequest, NextResponse } from "next/server"
import { getPlatformToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getPlatformToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  try {
    const res = await fetch(`${CMS_BASE_URL}/admin/signup-requests/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to reject signup request" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Signup request reject error:", err)
    return NextResponse.json({ error: "Failed to reject signup request" }, { status: 500 })
  }
}
