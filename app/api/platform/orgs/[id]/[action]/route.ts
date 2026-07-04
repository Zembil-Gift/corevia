import { NextRequest, NextResponse } from "next/server"
import { getPlatformToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ALLOWED = new Set(["suspend", "activate"])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const token = getPlatformToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id, action } = await params
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }
  try {
    const res = await fetch(`${CMS_BASE_URL}/admin/orgs/${encodeURIComponent(id)}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? `Failed to ${action} organization` },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error(`Platform org ${action} error:`, err)
    return NextResponse.json({ error: `Failed to ${action} organization` }, { status: 500 })
  }
}
