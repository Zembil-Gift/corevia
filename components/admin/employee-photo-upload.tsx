"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { UploadCloud, X } from "lucide-react"
import { Label } from "@/components/ui/label"

interface EmployeePhotoUploadProps {
  file: File | null
  onChange: (file: File | null) => void
  currentUrl?: string | null
  label?: string
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

export function EmployeePhotoUpload({
  file,
  onChange,
  currentUrl,
  label = "Employee photo",
}: EmployeePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const validate = (nextFile: File): string | null => {
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      return "Only PNG, JPG, GIF, and WEBP files are allowed."
    }
    if (nextFile.size > MAX_BYTES) {
      return "File must be 5 MB or smaller."
    }
    return null
  }

  const setFile = (nextFile: File | null) => {
    if (!nextFile) {
      setError("")
      onChange(null)
      return
    }
    const nextError = validate(nextFile)
    if (nextError) {
      setError(nextError)
      return
    }
    setError("")
    onChange(nextFile)
  }

  const imageUrl = previewUrl ?? currentUrl ?? ""
  const hasImage = Boolean(imageUrl)

  return (
    <div className="space-y-2">
      <Label className="text-zinc-200">{label}</Label>

      {hasImage ? (
        <div className="relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
          <div className="relative h-40 w-full">
            <Image src={imageUrl} alt="Employee photo preview" fill className="object-cover" unoptimized />
          </div>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800 px-4 py-8 text-center transition-colors hover:border-[#e78a53]/60 focus:outline-none"
        >
          <span className="flex flex-col items-center gap-2 text-zinc-400">
            <UploadCloud className="size-7" />
            <span className="text-sm">Click to upload one photo</span>
            <span className="text-xs text-zinc-500">PNG, JPG, GIF, WEBP · max 5 MB</span>
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0] ?? null
          setFile(selected)
          e.target.value = ""
        }}
      />

      {error && (
        <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      {!file && currentUrl ? (
        <p className="text-xs text-zinc-500">Current photo is shown. Upload a new one to replace it.</p>
      ) : null}
    </div>
  )
}
