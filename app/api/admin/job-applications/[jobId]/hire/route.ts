import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"
import type { JobApi } from "@/lib/jobs-api"

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

  let job: JobApi | null = null
  try {
    const jobRes = await cmsFetch(token, `${CMS_BASE_URL}/manager/jobs/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (jobRes.ok) {
      job = await jobRes.json()
    }
  } catch {
    // non-fatal: proceed without job context
  }

  try {
    const body = await request.json()
    const applicationId = Number(body.applicationId)
    const salaryAmountMinor = Number(body.salaryAmountMinor)
    const payload = {
      applicationId,
      phone: typeof body.phone === "string" ? body.phone.trim() : "",
      position: typeof body.position === "string" ? body.position.trim() : "",
      salaryDate: typeof body.salaryDate === "string" ? body.salaryDate.trim() : "",
      salaryAmountMinor: Math.trunc(salaryAmountMinor),
      department: job?.department ?? null,
      employmentStatus: job?.employmentType ?? null,
      subOrganizationId: typeof body.subOrganizationId === "number" ? body.subOrganizationId : (job?.subOrganizationId ?? null),
    }

    if (!Number.isFinite(payload.applicationId) || payload.applicationId <= 0) {
      return NextResponse.json({ error: "Valid application id is required" }, { status: 400 })
    }
    if (!payload.phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 })
    }
    if (!payload.position) {
      return NextResponse.json({ error: "Position is required" }, { status: 400 })
    }
    if (!payload.salaryDate) {
      return NextResponse.json({ error: "Salary date is required" }, { status: 400 })
    }
    if (!Number.isFinite(payload.salaryAmountMinor) || payload.salaryAmountMinor <= 0) {
      return NextResponse.json({ error: "Salary amount must be greater than zero" }, { status: 400 })
    }

    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/job-applications/${encodeURIComponent(jobId)}/hire`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to hire applicant" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin hire applicant error:", err)
    return NextResponse.json({ error: "Failed to hire applicant" }, { status: 500 })
  }
}
