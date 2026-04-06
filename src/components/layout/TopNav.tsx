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
  Sparkles,
} from "lucide-react"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manage", label: "Manage", icon: FolderKanban },
  { href: "/insights", label: "Insights", icon: BarChart2 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/networth", label: "Net worth", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function TopNav({ email }: { email: string }) {
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
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(13,13,12,0.88)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 clamp(1rem, 3vw, 2rem)",
          height: "3.75rem",
          display: "flex",
          alignItems: "center",
          gap: "clamp(1rem, 2.5vw, 2.5rem)",
        }}
      >
        {/* Logo — matches landing page nav exactly */}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.55rem",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "1.75rem",
              height: "1.75rem",
              background: "#22c55e",
              borderRadius: "0.4rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles style={{ width: "0.8rem", height: "0.8rem", color: "#0d0d0c" }} />
          </div>
          <span
            style={{
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#f0efe9",
              fontSize: "1rem",
            }}
          >
            Penny
          </span>
        </Link>

        {/* Nav links — desktop labels, mobile icons only */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.125rem",
            flex: 1,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.375rem 0.625rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.825rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#22c55e" : "rgba(240,239,233,0.48)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(240,239,233,0.85)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(240,239,233,0.48)"
                  }
                }}
              >
                {active && (
                  <motion.div
                    layoutId="topNavActive"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(34,197,94,0.1)",
                      borderRadius: "0.5rem",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: "0.9rem",
                    height: "0.9rem",
                    flexShrink: 0,
                    color: active ? "#22c55e" : "rgba(240,239,233,0.32)",
                  }}
                />
                {/* Label hidden on very small screens */}
                <span
                  className="hidden sm:inline"
                  style={{ position: "relative", zIndex: 1 }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User avatar + sign out */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "1.875rem",
              height: "1.875rem",
              borderRadius: "50%",
              background: "rgba(34,197,94,0.14)",
              border: "1px solid rgba(34,197,94,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#22c55e",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <a
            href="/auth/signout"
            title="Sign out"
            style={{
              color: "rgba(240,239,233,0.28)",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.color = "#f87171"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.color =
                "rgba(240,239,233,0.28)"
            }}
          >
            <LogOut style={{ width: "0.9rem", height: "0.9rem" }} />
          </a>
        </div>
      </div>

      <style>{`
        nav::-webkit-scrollbar { display: none; }
      `}</style>
    </header>
  )
}
