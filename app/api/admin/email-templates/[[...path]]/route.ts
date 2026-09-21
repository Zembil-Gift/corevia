import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const SEGMENT = /^[A-Za-z_]+$/

// JSON passthrough for the email builder: /api/admin/email-templates/** → /manager/email-templates/**.
async function proxy(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { path = [] } = await params
  if (path.length > 2 || !path.every((segment) => SEGMENT.test(segment))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const hasBody = request.method === "PUT" || request.method === "POST"
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/email-templates${path.map((s) => `/${s}`).join("")}`, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Email template request failed" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Email templates proxy error:", err)
    return NextResponse.json({ error: "Email template request failed" }, { status: 500 })
  }
}

export { proxy as GET, proxy as PUT, proxy as POST, proxy as DELETE }
