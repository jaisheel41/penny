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
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex h-screen w-60 shrink-0 flex-col overflow-hidden"
        style={{
          background: "#0d0d0c",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          WebkitFontSmoothing: "antialiased",
          position: "relative",
        }}
      >
        {/* Grain texture */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            opacity: 0.4,
          }}
        />
        {/* Ambient glow — top left */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-25%",
            left: "-35%",
            width: "85%",
            height: "55%",
            background:
              "radial-gradient(ellipse at center, rgba(34,197,94,0.1) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Ambient glow — bottom */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-20%",
            width: "65%",
            height: "40%",
            background:
              "radial-gradient(ellipse at center, rgba(13,148,136,0.07) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Logo */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "1.25rem 1.25rem 0.875rem",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "1.875rem",
                height: "1.875rem",
                background: "#22c55e",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles
                style={{ width: "0.9rem", height: "0.9rem", color: "#0d0d0c" }}
              />
            </div>
            <span
              style={{
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#f0efe9",
                fontSize: "1.05rem",
              }}
            >
              Penny
            </span>
          </Link>
          <div
            style={{
              marginTop: "1rem",
              height: "1px",
              background: "rgba(255,255,255,0.07)",
            }}
          />
        </div>

        {/* Nav links */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.375rem 0",
            position: "relative",
            zIndex: 1,
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
                  gap: "0.7rem",
                  padding: active
                    ? "0.625rem 0.75rem 0.625rem calc(0.75rem + 3px)"
                    : "0.625rem 0.75rem",
                  margin: "0.1rem 0.625rem",
                  borderRadius: active ? "0 0.625rem 0.625rem 0" : "0.625rem",
                  marginLeft: active ? 0 : "0.625rem",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#22c55e" : "rgba(240,239,233,0.48)",
                  borderLeft: active ? "3px solid #22c55e" : "3px solid transparent",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = "rgba(255,255,255,0.05)"
                    el.style.color = "rgba(240,239,233,0.82)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = ""
                    el.style.color = "rgba(240,239,233,0.48)"
                  }
                }}
              >
                {active && (
                  <motion.div
                    layoutId="activeNavBg"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(34,197,94,0.1)",
                      borderRadius: "0 0.625rem 0.625rem 0",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: "1rem",
                    height: "1rem",
                    flexShrink: 0,
                    color: active ? "#22c55e" : "rgba(240,239,233,0.32)",
                  }}
                />
                <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "0.875rem 1rem",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                flexShrink: 0,
                borderRadius: "50%",
                background: "rgba(34,197,94,0.14)",
                border: "1px solid rgba(34,197,94,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#22c55e",
              }}
            >
              {initial}
            </div>
            <p
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "0.72rem",
                color: "rgba(240,239,233,0.36)",
              }}
            >
              {email}
            </p>
            <a
              href="/auth/signout"
              title="Sign out"
              style={{
                flexShrink: 0,
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
              <LogOut style={{ width: "1rem", height: "1rem" }} />
            </a>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────────────────── */}
      <nav
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          height: "4rem",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(13,13,12,0.96)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {nav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.2rem",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: active ? "#22c55e" : "rgba(240,239,233,0.36)",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              <Icon style={{ width: "1.25rem", height: "1.25rem" }} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
