import { Users, Briefcase, Clock, TrendingUp, Wallet, LayoutGrid } from "lucide-react"

const navItems = [
  { label: "Overview", icon: LayoutGrid, active: true },
  { label: "Employees", icon: Users },
  { label: "Hiring", icon: Briefcase },
  { label: "Attendance", icon: Clock },
  { label: "Payments", icon: Wallet },
]

const stats = [
  { label: "Active employees", value: "5", trend: "+2 this month", accent: "text-emerald-400" },
  { label: "Open roles", value: "3", trend: "34 applicants", accent: "text-indigo-400" },
  { label: "Present today", value: "94%", trend: "4 / 6", accent: "text-teal-400" },
  { label: "Payroll due", value: "ETB37.5k", trend: "in 4 days", accent: "text-amber-400" },
]

const bars = [42, 66, 51, 78, 60, 88, 72]

export function DashboardPreview() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-slate-900/10 ring-1 ring-black/5">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <div className="ml-3 hidden rounded-md bg-background px-3 py-1 text-xs text-muted-foreground sm:block">
            app.corevia.com/overview
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
          {/* Sidebar */}
          <aside className="hidden flex-col gap-1 border-r border-border bg-slate-900 p-3 sm:flex">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                  item.active ? "bg-emerald-500 font-semibold text-emerald-950" : "text-slate-300"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            ))}
          </aside>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-background p-3">
                  <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{s.value}</p>
                  <p className={`mt-0.5 text-[11px] font-medium ${s.accent}`}>{s.trend}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Attendance this week</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-400">
                    <TrendingUp className="h-3.5 w-3.5" /> +4.2%
                  </span>
                </div>
                <div className="mt-4 flex h-28 items-end gap-2">
                  {bars.map((h, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-lime-400"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Recent hires</p>
                <ul className="mt-3 space-y-3">
                  {["Amara O.", "Daniel K.", "Sara M."].map((n, i) => (
                    <li key={n} className="flex items-center gap-2.5">
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white ${
                          ["bg-emerald-500", "bg-indigo-600", "bg-teal-600"][i]
                        }`}
                      >
                        {n[0]}
                      </span>
                      <span className="text-xs text-foreground">{n}</span>
                      <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Onboarding
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
