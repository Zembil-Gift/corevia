"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Building2, Loader2, X, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapLocationPicker } from "@/components/admin/map-location-picker"

interface CreateSubOrgModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateSubOrgModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateSubOrgModalProps) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [lat, setLat] = useState<number | null>(9.0105)
  const [lng, setLng] = useState<number | null>(38.7612)
  const [geoRadiusM, setGeoRadiusM] = useState<number>(500)
  const [officeStartTime, setOfficeStartTime] = useState("08:30")
  const [officeEndTime, setOfficeEndTime] = useState("17:30")
  const [graceMinutes, setGraceMinutes] = useState("15")
  const [lunchBreakStart, setLunchBreakStart] = useState("12:00")
  const [lunchBreakEnd, setLunchBreakEnd] = useState("13:00")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Sub-organization name is required")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        location: location.trim() || undefined,
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        geoRadiusM: geoRadiusM ? Number(geoRadiusM) : undefined,
        officeStartTime: officeStartTime ? (officeStartTime.length === 5 ? `${officeStartTime}:00` : officeStartTime) : undefined,
        officeEndTime: officeEndTime ? (officeEndTime.length === 5 ? `${officeEndTime}:00` : officeEndTime) : undefined,
        graceMinutes: graceMinutes ? parseInt(graceMinutes) : undefined,
        lunchBreakStart: lunchBreakStart ? (lunchBreakStart.length === 5 ? `${lunchBreakStart}:00` : lunchBreakStart) : undefined,
        lunchBreakEnd: lunchBreakEnd ? (lunchBreakEnd.length === 5 ? `${lunchBreakEnd}:00` : lunchBreakEnd) : undefined,
      }

      const res = await fetch("/api/admin/sub-organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create sub-organization")
      }

      onSuccess?.()
      onOpenChange(false)
      // reset
      setName("")
      setLocation("")
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sub-organization")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-white">
              <Building2 className="h-5 w-5 text-[#e78a53]" />
              <Dialog.Title>Add Sub-Organization</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-zinc-400">
                  Sub-Organization Name <span className="text-[#e78a53]">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Bole Branch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Location / Address</Label>
                <Input
                  placeholder="e.g. Camas Plaza, 4th Floor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                />
              </div>
            </div>

            {/* Map Geofence Section */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <MapPin className="h-4 w-4 text-[#e78a53]" />
                <span>Attendance Location & Geofence (Map)</span>
              </div>
              <p className="text-xs text-zinc-400">
                Employees assigned to this sub-organization will be checked against these coordinates during attendance clock-in.
              </p>
              <MapLocationPicker
                lat={lat}
                lng={lng}
                radiusMeters={geoRadiusM}
                onChange={(coords) => {
                  setLat(coords.lat)
                  setLng(coords.lng)
                  if (coords.radiusMeters) setGeoRadiusM(coords.radiusMeters)
                }}
              />
            </div>

            {/* Attendance Policy Overrides */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Clock className="h-4 w-4 text-[#e78a53]" />
                <span>Working Hours & Attendance Rules</span>
              </div>
              <p className="text-xs text-zinc-400">
                Custom office hours and late arrival tolerance for this branch.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-zinc-400">Office Start Time</Label>
                  <Input
                    type="time"
                    value={officeStartTime}
                    onChange={(e) => setOfficeStartTime(e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Office End Time</Label>
                  <Input
                    type="time"
                    value={officeEndTime}
                    onChange={(e) => setOfficeEndTime(e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Grace Minutes (Allowed Late)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <Label className="text-xs text-zinc-400">Lunch Break Start</Label>
                  <Input
                    type="time"
                    value={lunchBreakStart}
                    onChange={(e) => setLunchBreakStart(e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Lunch Break End</Label>
                  <Input
                    type="time"
                    value={lunchBreakEnd}
                    onChange={(e) => setLunchBreakEnd(e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium px-5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Sub-Organization"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
