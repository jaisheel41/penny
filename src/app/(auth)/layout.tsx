"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

// ── Signature: floating preview insight cards ─────────────────────────────
const PREVIEW_CARDS = [
  {
    label: "Spent this month",
    value: "£843",
    sub: "Food 38% · Transport 22%",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.22)",
    offset: false,
  },
  {
    label: "2 subs renewing",
    value: "This week",
    sub: "Spotify · Netflix",
    bg: "rgba(13,148,136,0.1)",
    border: "rgba(13,148,136,0.18)",
    offset: true,
  },
  {
    label: "Month forecast",
    value: "£1,240",
    sub: "↑ On track",
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
    offset: false,
  },
]

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid min-h-screen lg:grid-cols-2"
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      {/* ── LEFT — dark brand panel ──────────────────────────────── */}
      <aside
        className="relative hidden overflow-hidden lg:flex lg:flex-col"
        style={{
          background: "#0d0d0c",
          padding: "clamp(2rem,4.5vw,3.5rem)",
          WebkitFontSmoothing: "antialiased",
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
        {/* Glow — top left */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-15%",
            left: "-20%",
            width: "75%",
            height: "60%",
            background:
              "radial-gradient(ellipse at center, rgba(34,197,94,0.13) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Glow — bottom right */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: "60%",
            height: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(13,148,136,0.1) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                background: "#22c55e",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles style={{ width: "1rem", height: "1rem", color: "#0d0d0c" }} />
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
        </motion.div>

        {/* Brand copy + preview cards */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
            paddingTop: "1.5rem",
            paddingBottom: "1.5rem",
          }}
        >
          {/* Outlined headline — matches landing page signature */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            style={{
              fontSize: "clamp(2.4rem,4vw,3.75rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: "0.9",
              textTransform: "uppercase",
              marginBottom: "2.75rem",
            }}
          >
            {(["Your money,", "finally"] as const).map((line) => (
              <span
                key={line}
                style={{
                  display: "block",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  WebkitTextStroke: "1.5px rgba(240,239,233,0.52)",
                }}
              >
                {line}
              </span>
            ))}
            <span
              style={{
                display: "block",
                color: "#22c55e",
                WebkitTextFillColor: "#22c55e",
                WebkitTextStroke: "0px",
              }}
            >
              clear.
            </span>
          </motion.h1>

          {/* Signature: staggered preview insight chips */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.7rem",
              maxWidth: "23rem",
            }}
          >
            {PREVIEW_CARDS.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.35 + i * 0.12, ease }}
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  borderRadius: "0.875rem",
                  padding: "0.875rem 1.125rem",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  marginLeft: card.offset ? "1.75rem" : 0,
                }}
              >
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(240,239,233,0.38)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "0.2rem",
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#f0efe9",
                    lineHeight: 1.25,
                  }}
                >
                  {card.value}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "rgba(240,239,233,0.38)",
                    marginTop: "0.15rem",
                  }}
                >
                  {card.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: "0.72rem",
            color: "rgba(240,239,233,0.24)",
            lineHeight: 1.6,
          }}
        >
          Magic links only — no password stored on our servers.{" "}
          <Link
            href="/"
            style={{ color: "rgba(240,239,233,0.42)", textDecoration: "underline" }}
          >
            Back to home
          </Link>
        </motion.p>
      </aside>

      {/* ── RIGHT — form panel ───────────────────────────────────── */}
      <main
        className="relative flex flex-col items-center justify-center"
        style={{
          background: "#f3f1ec",
          padding: "clamp(2rem,5vw,4rem)",
          overflow: "hidden",
          minHeight: "100svh",
        }}
      >
        {/* Paper noise */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
            opacity: 0.55,
          }}
        />
        {/* Glow — top right */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-8%",
            right: "-8%",
            width: "55%",
            height: "50%",
            background:
              "radial-gradient(ellipse, rgba(22,163,74,0.07) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Mobile-only logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-10 lg:hidden"
          style={{ position: "relative", zIndex: 1 }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
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
              }}
            >
              <Sparkles style={{ width: "0.9rem", height: "0.9rem", color: "#0d0d0c" }} />
            </div>
            <span
              style={{
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#1c1917",
                fontSize: "1.05rem",
              }}
            >
              Penny
            </span>
          </Link>
        </motion.div>

        {/* Form children */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "22rem" }}>
          {children}
        </div>

        {/* Mobile footer */}
        <p
          className="mt-8 text-center text-xs lg:hidden"
          style={{
            position: "relative",
            zIndex: 1,
            color: "rgba(28,25,23,0.4)",
            lineHeight: 1.6,
          }}
        >
          Magic links only.{" "}
          <Link
            href="/"
            style={{ color: "#0d9488", textDecoration: "none", fontWeight: 500 }}
          >
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  )
}
