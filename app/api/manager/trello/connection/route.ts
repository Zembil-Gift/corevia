import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// Manager's own Trello connection: GET status, POST connect (token), DELETE disconnect.
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
    const res = await fetch(`${CMS_BASE_URL}/manager/trello/connection`, init)
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return new NextResponse(null, { status: res.status })
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Trello request failed" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Trello connection proxy error:", err)
    return NextResponse.json({ error: "Failed to reach Trello service" }, { status: 500 })
  }
}

export const GET = (r: NextRequest) => forward(r, "GET")
export const POST = (r: NextRequest) => forward(r, "POST")
export const DELETE = (r: NextRequest) => forward(r, "DELETE")
