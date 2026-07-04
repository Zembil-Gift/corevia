import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { buildMultipartBody } from "@/lib/multipart"
import { postRaw } from "@/lib/raw-http"
import { DAY_OF_WEEK_VALUES, type DayOfWeekApi } from "@/lib/employees-api"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

export async function GET(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") ?? "0"
    const size = searchParams.get("size") ?? "10"
    const sortBy = searchParams.get("sortBy") ?? "createdAt"
    const direction = searchParams.get("direction") ?? "desc"

    const params = new URLSearchParams()
    params.set("page", page)
    params.set("size", size)
    params.set("sortBy", sortBy)
    params.set("direction", direction)

    const res = await fetch(`${CMS_BASE_URL}/manager/employees?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch employees" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin employees list error:", err)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = [...formData.getAll("file"), ...formData.getAll("photo")]
    if (files.length > 1) {
      return NextResponse.json({ error: "Only one photo can be uploaded" }, { status: 400 })
    }

    const file = files[0]
    if (file instanceof File) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Only PNG, JPG, GIF, and WEBP files are allowed" },
          { status: 400 }
        )
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "File must be 5 MB or smaller" }, { status: 400 })
      }
    }

    const name = formData.get("name")
    const email = formData.get("email")
    const phone = formData.get("phone")
    const position = formData.get("position")
    const linkedinUrl = formData.get("linkedinUrl")
    const photoUrl = formData.get("photoUrl")
    const salaryDate = formData.get("salaryDate")
    const salaryAmountMinor = formData.get("salaryAmountMinor")
    const rawScheduleDays = formData
      .getAll("salaryScheduleDays")
      .filter((value): value is string => typeof value === "string")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean)

    const fields: Record<string, string> = {}
    if (typeof name === "string") fields.name = name.trim()
    if (typeof email === "string") fields.email = email.trim()
    if (typeof phone === "string") fields.phone = phone.trim()
    if (typeof position === "string") fields.position = position.trim()
    if (typeof linkedinUrl === "string" && linkedinUrl.trim()) {
      fields.linkedinUrl = linkedinUrl.trim()
    }
    if (typeof photoUrl === "string" && photoUrl.trim()) {
      fields.photoUrl = photoUrl.trim()
    }
    if (typeof salaryDate === "string" && salaryDate.trim()) {
      fields.salaryDate = salaryDate.trim()
    }
    if (typeof salaryAmountMinor === "string" && salaryAmountMinor.trim()) {
      const salaryAmount = Number(salaryAmountMinor)
      if (!Number.isFinite(salaryAmount) || salaryAmount < 0) {
        return NextResponse.json({ error: "Salary amount must be zero or greater" }, { status: 400 })
      }
      fields.salaryAmountMinor = String(Math.trunc(salaryAmount))
    }
    const allowedDays = new Set<DayOfWeekApi>(DAY_OF_WEEK_VALUES)
    const validScheduleDays = rawScheduleDays.filter((day): day is DayOfWeekApi =>
      allowedDays.has(day as DayOfWeekApi)
    )
    if (validScheduleDays.length > 0) {
      fields.salaryScheduleDays = validScheduleDays.join(",")
    }

    const { body, contentType } = await buildMultipartBody({
      fields,
      fileFieldName: "photo",
      file: file instanceof File ? file : undefined,
    })

    const res = await postRaw({
      url: `${CMS_BASE_URL}/manager/employees/form`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
      },
      body,
    })

    let data: { message?: string } | Record<string, unknown> = {}
    try {
      data = JSON.parse(res.bodyText || "{}") as { message?: string }
    } catch {
      data = {}
    }
    if (res.status < 200 || res.status >= 300) {
      return NextResponse.json(
        { error: data.message ?? "Failed to create employee" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin create employee error:", err)
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
  }
}
