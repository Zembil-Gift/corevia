import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getAdminToken } from "@/lib/auth"

const ACCEPTED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured")
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export async function POST(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bucketName = process.env.R2_BUCKET_NAME
  const publicUrl = process.env.R2_PUBLIC_URL

  if (!bucketName || !publicUrl) {
    return NextResponse.json(
      { error: "R2 bucket is not configured" },
      { status: 500 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const ext = ACCEPTED_TYPES[file.type]
  if (!ext) {
    return NextResponse.json(
      { error: "Only PNG, JPG, and WEBP files are allowed" },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be 5 MB or smaller" },
      { status: 400 }
    )
  }

  const filename = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      })
    )
  } catch (err) {
    console.error("R2 upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }

  const url = `${publicUrl.replace(/\/$/, "")}/${filename}`
  return NextResponse.json({ url })
}
