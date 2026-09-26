import { BroadcastComposer } from "@/components/admin/broadcast-composer"

export default function BroadcastsPage() {
  return (
    <div className="pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">Broadcasts</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Send an announcement to everyone or to chosen branches. People see it in their notifications and, if you choose, by email.
        </p>
      </div>
      <BroadcastComposer />
    </div>
  )
}
