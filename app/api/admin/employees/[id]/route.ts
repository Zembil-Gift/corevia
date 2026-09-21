import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"
import { DAY_OF_WEEK_VALUES, type DayOfWeekApi } from "@/lib/employees-api"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing employee id" }, { status: 400 })
  }

  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/employees/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch employee" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin get employee error:", err)
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing employee id" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const scheduleDays = Array.isArray(body.salaryScheduleDays)
      ? body.salaryScheduleDays.filter(
          (day: unknown): day is DayOfWeekApi =>
            typeof day === "string" && DAY_OF_WEEK_VALUES.includes(day as DayOfWeekApi)
        )
      : undefined

    const salaryAmount =
      typeof body.salaryAmountMinor === "number" && Number.isFinite(body.salaryAmountMinor)
        ? Math.trunc(body.salaryAmountMinor)
        : body.salaryAmountMinor === null
          ? null
          : undefined
    if (typeof salaryAmount === "number" && salaryAmount < 0) {
      return NextResponse.json({ error: "Salary amount must be zero or greater" }, { status: 400 })
    }

    const payload = {
      name: typeof body.name === "string" ? body.name.trim() : body.name === null ? null : undefined,
      email: typeof body.email === "string" ? body.email.trim() : body.email === null ? null : undefined,
      phone: typeof body.phone === "string" ? body.phone.trim() : body.phone === null ? null : undefined,
      position:
        typeof body.position === "string" ? body.position.trim() : body.position === null ? null : undefined,
      linkedinUrl:
        typeof body.linkedinUrl === "string"
          ? body.linkedinUrl.trim()
          : body.linkedinUrl === null
            ? null
            : undefined,
      photo: typeof body.photo === "string" ? body.photo.trim() : body.photo === null ? null : undefined,
      active: typeof body.active === "boolean" ? body.active : body.active === null ? null : undefined,
      salaryDate:
        typeof body.salaryDate === "string" ? body.salaryDate.trim() : body.salaryDate === null ? null : undefined,
      salaryAmountMinor: salaryAmount,
      salaryScheduleDays: scheduleDays ?? (body.salaryScheduleDays === null ? null : undefined),
      subOrganizationId: typeof body.subOrganizationId === "number" ? body.subOrganizationId : body.subOrganizationId === null ? null : undefined,
    }

    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/employees/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to update employee" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin update employee error:", err)
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing employee id" }, { status: 400 })
  }

  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/employees/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.status === 204 || res.ok) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (data as { message?: string }).message ?? "Failed to delete employee" },
      { status: res.status }
    )
  } catch (err) {
    console.error("Admin delete employee error:", err)
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 })
  }
}
