import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// Changes the logged-in manager's password: body { otp, newPassword }.
export async function PUT(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/me/password`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to change password" },
        { status: res.status }
      )
    }
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error("Manager change password error:", err)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
