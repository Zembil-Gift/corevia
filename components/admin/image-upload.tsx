"use client"

import { useRef, useState } from "react"
import { Link2, Loader2, UploadCloud, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  /** Upload target proxied by /api/admin/org/[target] to the backend's R2 upload. */
  target: "blog-cover" | "event-cover"
  label?: string
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_INPUT_BYTES = 20 * 1024 * 1024 // raw phone photos are fine; they get compressed below
const MAX_BYTES = 5 * 1024 * 1024 // server limit, checked after compression
const MAX_DIMENSION = 1920 // longest side; covers never render wider than a full-width hero
const QUALITY = 0.82

// Downscale + re-encode in the browser (canvas) so covers upload and load fast.
// WebP where the browser can encode it, JPEG otherwise; keeps the original if that is already smaller.
async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY))
  let blob = await encode("image/webp")
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg")
  if (!blob || blob.size >= file.size) return file

  const ext = blob.type === "image/webp" ? "webp" : "jpg"
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, { type: blob.type })
}

function isHttpUrl(s: string) {
  try {
    const u = new URL(s)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

// One cover image: either uploaded or pasted as a URL, never both — the value is a single URL.
export function ImageUpload({ value, onChange, target, label = "Cover image" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<"upload" | "url">("upload")
  const [urlDraft, setUrlDraft] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [dragging, setDragging] = useState(false)

  async function uploadFile(file: File) {
    setUploadError("")

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Only PNG, JPG, and WEBP files are allowed.")
      return
    }
    if (file.size > MAX_INPUT_BYTES) {
      setUploadError("File must be 20 MB or smaller.")
      return
    }

    setUploading(true)
    try {
      file = await compressImage(file).catch(() => file)
      if (file.size > MAX_BYTES) {
        setUploadError("Image is still over 5 MB after compression. Try a smaller image.")
        return
      }
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/admin/org/${target}`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || typeof data?.url !== "string") {
        setUploadError(data?.error ?? "Upload failed.")
        return
      }
      onChange(data.url)
    } catch {
      setUploadError("Upload failed. Check your connection and try again.")
    } finally {
      setUploading(false)
    }
  }

  function applyUrl() {
    const url = urlDraft.trim()
    if (!isHttpUrl(url)) {
      setUploadError("Enter a valid http(s) image URL.")
      return
    }
    setUploadError("")
    onChange(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const tabClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
      active ? "bg-[#e78a53] text-white" : "text-zinc-400 hover:text-white"
    }`

  return (
    <div className="space-y-2">
      <Label className="text-zinc-200">{label}</Label>

      {value ? (
        <div className="relative w-full rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element -- pasted URLs can be any host */}
          <img src={value} alt="Cover preview" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => { onChange(""); setUrlDraft(""); setUploadError("") }}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <>
          <div role="tablist" className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-0.5">
            <button type="button" role="tab" aria-selected={mode === "upload"} className={tabClass(mode === "upload")}
              onClick={() => { setMode("upload"); setUploadError("") }}>
              <UploadCloud className="size-3.5" /> Upload
            </button>
            <button type="button" role="tab" aria-selected={mode === "url"} className={tabClass(mode === "url")}
              onClick={() => { setMode("url"); setUploadError("") }}>
              <Link2 className="size-3.5" /> Image URL
            </button>
          </div>

          {mode === "upload" ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`w-full rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors focus:outline-none ${
                dragging
                  ? "border-[#e78a53] bg-[#e78a53]/10"
                  : "border-zinc-700 bg-zinc-800 hover:border-[#e78a53]/60"
              }`}
            >
              {uploading ? (
                <span className="flex flex-col items-center gap-2 text-zinc-400">
                  <Loader2 className="size-7 animate-spin text-[#e78a53]" />
                  <span className="text-sm">Uploading…</span>
                </span>
              ) : (
                <span className="flex flex-col items-center gap-2 text-zinc-400">
                  <UploadCloud className="size-7" />
                  <span className="text-sm">Click to upload or drag &amp; drop</span>
                  <span className="text-xs text-zinc-500">PNG, JPG, WEBP · auto-compressed</span>
                </span>
              )}
            </button>
          ) : (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://..."
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyUrl() } }}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={applyUrl}
                className="shrink-0 rounded-md bg-[#e78a53] px-3 text-sm font-medium text-white hover:bg-[#e78a53]/90"
              >
                Use URL
              </button>
            </div>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploadError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {uploadError}
        </p>
      )}
    </div>
  )
}
