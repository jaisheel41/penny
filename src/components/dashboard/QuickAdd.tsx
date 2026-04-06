"use client"

import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

import { parseSpendLine } from "@/lib/utils/parser"
import { MOTION } from "@/lib/motion/presets"

export function QuickAdd() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const r = reduceMotion === true
  const [line, setLine] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const parsed = line.trim() ? parseSpendLine(line) : null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!line.trim() || !parsed) return
    setLoading(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: line }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to add")
        return
      }
      setLine("")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      whileHover={r ? undefined : { scale: 1.002 }}
      transition={{ duration: MOTION.fast }}
      style={{
        background: "#0d0d0c",
        borderRadius: "1rem",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        border: focused
          ? "1px solid rgba(34,197,94,0.3)"
          : "1px solid rgba(255,255,255,0.07)",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
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
      {/* Glow — follows focus */}
      {focused && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-40%",
            left: "-20%",
            width: "70%",
            height: "90%",
            background:
              "radial-gradient(ellipse at center, rgba(34,197,94,0.08) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.875rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Terminal prompt indicator */}
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#22c55e",
            }}
          >
            Quick add
          </span>
        </div>
        <p
          style={{
            fontSize: "0.7rem",
            color: "rgba(240,239,233,0.28)",
          }}
        >
          Natural language — we parse it for you.
        </p>
      </div>

      {/* Input row */}
      <form onSubmit={onSubmit} style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "0.625rem",
            padding: "0.75rem 1rem",
            transition: "border-color 0.15s ease",
          }}
        >
          {/* Terminal prompt char */}
          <span
            style={{
              flexShrink: 0,
              fontSize: "0.9rem",
              color: "#22c55e",
              fontFamily: "var(--font-geist-mono, 'Geist Mono', ui-monospace, monospace)",
              lineHeight: 1,
              userSelect: "none",
            }}
            aria-hidden
          >
            &gt;
          </span>

          <input
            ref={inputRef}
            value={line}
            onChange={(e) => setLine(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder='Try "Deliveroo £18" or "Coffee £3.50"'
            autoComplete="off"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "0.9375rem",
              color: "#f0efe9",
              fontFamily: "var(--font-geist-mono, 'Geist Mono', ui-monospace, monospace)",
            }}
          />

          <AnimatePresence>
            {parsed && (
              <motion.span
                key="preview"
                initial={r ? false : { opacity: 0, scale: 0.85, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={r ? undefined : { opacity: 0, scale: 0.85, x: 8 }}
                transition={{ duration: MOTION.fast }}
                style={{
                  display: "none",
                  flexShrink: 0,
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "#22c55e",
                }}
                className="sm:flex"
              >
                <span>{parsed.merchant}</span>
                <span style={{ color: "rgba(34,197,94,0.4)" }}>·</span>
                <span>
                  {parsed.currencySymbol ?? "£"}
                  {parsed.amount.toFixed(2)}
                </span>
              </motion.span>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {parsed && (
              <motion.button
                key="submit"
                type="submit"
                initial={r ? false : { opacity: 0, x: 8, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={r ? undefined : { opacity: 0, x: 8, scale: 0.9 }}
                transition={{ duration: MOTION.fast }}
                disabled={loading}
                style={{
                  flexShrink: 0,
                  padding: "0.375rem 1rem",
                  borderRadius: "9999px",
                  background: "#22c55e",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#0d0d0c",
                  opacity: loading ? 0.6 : 1,
                  fontFamily: "var(--font-geist-sans)",
                  transition: "opacity 0.15s ease, background 0.15s ease",
                }}
              >
                {loading ? "Adding…" : "Add"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Feedback messages */}
      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={r ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={r ? undefined : { opacity: 0 }}
            style={{
              position: "relative",
              zIndex: 1,
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: "#f87171",
            }}
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            key="success"
            initial={r ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={r ? undefined : { opacity: 0 }}
            style={{
              position: "relative",
              zIndex: 1,
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#22c55e",
            }}
          >
            ✓ Added successfully
          </motion.p>
        )}
      </AnimatePresence>

      <style>{`
        input::placeholder { color: rgba(240,239,233,0.22) !important; }
      `}</style>
    </motion.div>
  )
}
