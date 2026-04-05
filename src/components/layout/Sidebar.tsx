"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  FolderKanban,
  BarChart2,
  Target,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manage", label: "Manage", icon: FolderKanban },
  { href: "/insights", label: "Insights", icon: BarChart2 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/networth", label: "Net worth", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
]

const mobileNav = nav

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const initial = email.charAt(0).toUpperCase() || "U"

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return (
      pathname === href ||
      pathname.startsWith(href + "/") ||
      pathname.startsWith(href + "?")
    )
  }

  return (
    <>
      <aside className="hidden h-screen w-60 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar elevation-sm md:flex">
        <div className="px-5 pb-3 pt-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-penny-green shadow-elevation-sm">
              <span className="text-[13px] font-bold leading-none text-white">
                £
              </span>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-foreground">
              Penny
            </span>
          </Link>
          <div className="mt-4 h-px bg-border" />
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 overflow-hidden py-2.5 text-sm transition-colors duration-[var(--motion-fast)]",
                  active
                    ? "pr-3 font-medium text-penny-green"
                    : "mx-2 rounded-[10px] px-3 font-normal text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
                style={
                  active
                    ? {
                        borderLeft: "3px solid var(--penny-green)",
                        borderRadius: "0 10px 10px 0",
                        paddingLeft: "calc(0.75rem + 3px)",
                        marginLeft: 0,
                      }
                    : undefined
                }
              >
                {active && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-penny-green-muted"
                    style={{ borderRadius: "0 10px 10px 0" }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 size-[18px] shrink-0",
                    active ? "text-penny-green" : "text-muted-foreground/70"
                  )}
                />
                <span className="relative z-10">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-penny-green-muted text-sm font-semibold text-penny-green">
              {initial}
            </div>
            <p className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
              {email}
            </p>
            <a
              href="/auth/signout"
              title="Sign out"
              className="shrink-0 text-muted-foreground/70 transition-colors hover:text-destructive"
            >
              <LogOut className="size-4" />
            </a>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-sidebar-border bg-sidebar/95 shadow-elevation-md backdrop-blur-sm md:hidden">
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors duration-[var(--motion-fast)]",
                active
                  ? "text-penny-green"
                  : "text-muted-foreground/70 hover:text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
