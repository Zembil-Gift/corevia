import Link from "next/link"
import { AdminNav } from "@/components/admin/admin-nav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed left-0 top-0 z-30 h-full w-56 border-r border-zinc-800 bg-zinc-900/95 backdrop-blur">
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-800 p-4">
            <Link href="/manager" className="flex items-center gap-2 font-semibold text-[#e78a53]">
              
              <span>Corevia</span>
            </Link>
          </div>
          <AdminNav />
        </div>
      </aside>
      <main className="pl-56">
        <div className="min-h-screen p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
