"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { AdminNav } from "@/components/admin/admin-nav"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const Brand = (
    <Link href="/manager" className="flex items-center gap-2 font-semibold text-[#e78a53]">
      <span>Mahberix</span>
    </Link>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-800 bg-zinc-900/95 px-4 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="-ml-1 rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        {Brand}
      </header>

      {/* Desktop fixed sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-56 border-r border-zinc-800 bg-zinc-900/95 backdrop-blur md:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-800 p-4">{Brand}</div>
          <AdminNav />
        </div>
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-64 border-r border-zinc-800 bg-zinc-900 shadow-xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              {Brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminNav onNavigate={() => setOpen(false)} />
          </div>
        </aside>
      </div>

      <main className="md:pl-56">
        <div className="min-h-screen p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
