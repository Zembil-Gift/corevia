import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

/** Forwards a principle request to the CMS API with the caller's manager token. */
export async function forwardPrinciples(request: NextRequest, path: string, method: string) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const body = method === "POST" || method === "PUT" ? await request.text() : undefined
    const res = await fetch(`${CMS_BASE_URL}/manager/metrics/peer-reviews/principles${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body || undefined,
      cache: "no-store",
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string } | null)?.message ?? "Principle request failed" },
        { status: res.status }
      )
    }
    return NextResponse.json(data ?? { success: true })
  } catch (err) {
    console.error("Principles proxy error:", err)
    return NextResponse.json({ error: "Principle request failed" }, { status: 500 })
  }
}
