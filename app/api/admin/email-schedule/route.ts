import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// GET/PUT the org's email schedule → /manager/email-schedule.
async function proxy(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const isPut = request.method === "PUT"
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/email-schedule`, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isPut ? { "Content-Type": "application/json" } : {}),
      },
      body: isPut ? await request.text() : undefined,
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Email schedule request failed" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Email schedule proxy error:", err)
    return NextResponse.json({ error: "Email schedule request failed" }, { status: 500 })
  }
}

export { proxy as GET, proxy as PUT }
