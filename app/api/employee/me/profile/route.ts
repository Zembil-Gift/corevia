import { NextRequest, NextResponse } from "next/server"
import { getEmployeeToken } from "@/lib/auth"
import { buildMultipartBody } from "@/lib/multipart"
import { postRaw } from "@/lib/raw-http"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  const token = getEmployeeToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()

    const linkedinUrl = formData.get("linkedinUrl")
    const files = [...formData.getAll("file"), ...formData.getAll("photo")]
    const photo =
      files.length === 1 && files[0] instanceof File ? files[0] : null

    if (photo && !ACCEPTED_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, GIF, and WEBP files are allowed" },
        { status: 400 }
      )
    }
    if (photo && photo.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be 5 MB or smaller" }, { status: 400 })
    }

    const fields: Record<string, string> = {}
    if (typeof linkedinUrl === "string" && linkedinUrl.trim()) {
      fields.linkedinUrl = linkedinUrl.trim()
    }

    if (!photo && Object.keys(fields).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      )
    }

    const { body, contentType } = await buildMultipartBody({
      fields,
      fileFieldName: "photo",
      file: photo ?? undefined,
    })

    const res = await postRaw({
      url: `${CMS_BASE_URL}/employee/me/profile`,
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
        { error: (data as { message?: string }).message ?? "Failed to update profile" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Employee update profile error:", err)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
