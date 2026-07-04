"use client"

import { useRef, useState } from "react"
import { Loader2, UploadCloud, X } from "lucide-react"
import Image from "next/image"
import { Label } from "@/components/ui/label"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export function ImageUpload({ value, onChange, label = "Cover image" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [dragging, setDragging] = useState(false)

  async function uploadFile(file: File) {
    setUploadError("")

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Only PNG, JPG, and WEBP files are allowed.")
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError("File must be 5 MB or smaller.")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data?.error ?? "Upload failed.")
        return
      }
      onChange(data.url as string)
    } catch {
      setUploadError("Upload failed. Check your connection and try again.")
    } finally {
      setUploading(false)
    }
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

  return (
    <div className="space-y-2">
      <Label className="text-zinc-200">{label}</Label>

      {value ? (
        <div className="relative w-full rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
          <div className="relative h-40 w-full">
            <Image
              src={value}
              alt="Cover preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={() => { onChange(""); setUploadError("") }}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
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
              <span className="text-sm">
                Click to upload or drag &amp; drop
              </span>
              <span className="text-xs text-zinc-500">PNG, JPG, WEBP · max 5 MB</span>
            </span>
          )}
        </button>
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
