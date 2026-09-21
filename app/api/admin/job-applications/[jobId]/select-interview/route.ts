import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { jobId } = await params
  if (!jobId) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const rawApplicationIds = Array.isArray(body.applicationIds) ? body.applicationIds : []
    const applicationIds = rawApplicationIds
      .map((value: unknown) => Number(value))
      .filter((value: number) => Number.isFinite(value) && value > 0)

    if (applicationIds.length === 0) {
      return NextResponse.json({ error: "At least one application id is required" }, { status: 400 })
    }

    const res = await cmsFetch(token,
      `${CMS_BASE_URL}/manager/job-applications/${encodeURIComponent(jobId)}/select-interview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationIds }),
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to select interview candidates" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin select interview candidates error:", err)
    return NextResponse.json({ error: "Failed to select interview candidates" }, { status: 500 })
  }
}
