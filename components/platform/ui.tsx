import type { LucideIcon } from "lucide-react"

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function OrgStatusBadge({ status }: { status: string }) {
  const active = status?.toUpperCase() === "ACTIVE"
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        active
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-amber-500/15 text-amber-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-amber-400"}`} />
      {active ? "Active" : "Suspended"}
    </span>
  )
}

/** Horizontal bar list: a lightweight, theme-friendly ranking chart. */
export function BarList({
  title,
  rows,
}: {
  title: string
  rows: { label: string; value: number }[]
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-4 space-y-3">
        {rows.length === 0 && <li className="text-sm text-muted-foreground">No data yet.</li>}
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-sm text-foreground">{r.label}</span>
            <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
