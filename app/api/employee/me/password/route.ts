import { NextRequest, NextResponse } from "next/server"
import { getEmployeeToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function POST(request: NextRequest) {
  const token = getEmployeeToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = {
      currentPassword: typeof body.currentPassword === "string" ? body.currentPassword : "",
      newPassword: typeof body.newPassword === "string" ? body.newPassword : "",
    }

    const res = await fetch(`${CMS_BASE_URL}/employee/me/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (res.status === 204 || res.ok) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (data as { message?: string }).message ?? "Failed to change password" },
      { status: res.status }
    )
  } catch (err) {
    console.error("Employee change password error:", err)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
