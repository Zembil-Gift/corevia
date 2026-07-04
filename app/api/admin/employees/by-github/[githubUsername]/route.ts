import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: { githubUsername: string } }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const githubUsername = params.githubUsername
  if (!githubUsername) {
    return NextResponse.json(
      { error: "githubUsername is required" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `${CMS_BASE_URL}/manager/employees/by-github/${encodeURIComponent(githubUsername)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            (data as { message?: string }).message ??
            "Failed to fetch employee",
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin employee by github username error:", err)
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    )
  }
}
