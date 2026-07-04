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
    const files = [...formData.getAll("file"), ...formData.getAll("photo")]
    if (files.length !== 1 || !(files[0] instanceof File)) {
      return NextResponse.json({ error: "A single photo file is required" }, { status: 400 })
    }

    const file = files[0]
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, GIF, and WEBP files are allowed" },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be 5 MB or smaller" }, { status: 400 })
    }

    const { body, contentType } = await buildMultipartBody({ file })

    const res = await postRaw({
      url: `${CMS_BASE_URL}/employee/me/photo`,
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
        { error: (data as { message?: string }).message ?? "Failed to upload photo" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Employee upload photo error:", err)
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
  }
}
