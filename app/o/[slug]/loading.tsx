import { Loader2 } from "lucide-react"

// Commit navigations between server-rendered org pages immediately (see app/manager/loading.tsx).
export default function Loading() {
  return (
    <div className="flex justify-center py-24" role="status" aria-label="Loading">
      <Loader2 className="size-8 animate-spin text-emerald-400" />
    </div>
  )
}
