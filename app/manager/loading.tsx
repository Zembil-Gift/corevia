import { Loader2 } from "lucide-react"

// Lets the router commit a navigation immediately; without it, clicking into the dashboard
// (which fans out to many API calls server-side) looked like a dead link until it rendered.
export default function Loading() {
  return (
    <div className="flex justify-center py-24" role="status" aria-label="Loading">
      <Loader2 className="size-8 animate-spin text-[#e78a53]" />
    </div>
  )
}
