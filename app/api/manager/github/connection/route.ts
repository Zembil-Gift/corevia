import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// Manager's own GitHub connection: GET status, POST connect (oauth code), DELETE disconnect.
async function forward(request: NextRequest, method: "GET" | "POST" | "DELETE") {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const init: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }
  if (method === "POST") {
    init.headers = { ...init.headers, "Content-Type": "application/json" }
    init.body = await request.text()
  }

  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/github/connection`, init)
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return new NextResponse(null, { status: res.status })
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "GitHub request failed" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("GitHub connection proxy error:", err)
    return NextResponse.json({ error: "Failed to reach GitHub service" }, { status: 500 })
  }
}

export const GET = (r: NextRequest) => forward(r, "GET")
export const POST = (r: NextRequest) => forward(r, "POST")
export const DELETE = (r: NextRequest) => forward(r, "DELETE")
