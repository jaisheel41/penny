"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FolderKanban,
  LayoutDashboard,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manage", label: "Manage", icon: FolderKanban },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Sparkles className="size-4" />
        </div>
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-sidebar-foreground"
        >
          Penny
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5 p-3 pt-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40">
          Navigation
        </p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40">
            Penny v1
          </p>
          <p className="mt-1 text-xs text-sidebar-foreground/50">
            Your money, spoken plainly
          </p>
        </div>
      </div>
    </aside>
  )
}
