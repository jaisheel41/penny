"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarDays, Plus, RefreshCw, Trash2 } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { Switch } from "@/components/ui/switch"
import { formatMoney } from "@/lib/utils/parser"
import type { Database } from "@/lib/supabase/types"
import { MOTION } from "@/lib/motion/presets"

type Row = Database["public"]["Tables"]["subscriptions"]["Row"]

const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: MOTION.easeOutSoft, delay: i * 0.06 },
  }),
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.18 } },
}

const darkInput: React.CSSProperties = {
  height: "2.25rem",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  padding: "0 0.75rem",
  fontSize: "0.875rem",
  color: "#f0efe9",
  outline: "none",
  fontFamily: "var(--font-geist-sans)",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
}

export function SubscriptionsClient({
  currency,
  initial,
}: {
  currency: string
  initial: Row[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [renewalDay, setRenewalDay] = useState("1")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthlyTotal = useMemo(
    () =>
      rows
        .filter((r) => r.active)
        .reduce((s, r) => s + Number.parseFloat(r.amount), 0),
    [rows]
  )

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    ;(e.target as HTMLInputElement).style.borderColor = "rgba(34,197,94,0.5)"
    ;(e.target as HTMLInputElement).style.boxShadow =
      "0 0 0 3px rgba(34,197,94,0.08)"
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    ;(e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"
    ;(e.target as HTMLInputElement).style.boxShadow = "none"
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const a = Number(amount)
    const rd = Number(renewalDay)
    if (!name.trim() || !Number.isFinite(a) || a <= 0) return
    if (!Number.isInteger(rd) || rd < 1 || rd > 31) return
    setLoading(true)
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), amount: a, renewal_day: rd }),
      })
      const row = await res.json()
      if (res.ok) {
        setRows((r) =>
          [...r, row].sort((a, b) => a.name.localeCompare(b.name))
        )
        setName("")
        setAmount("")
        setRenewalDay("1")
        router.refresh()
      } else {
        setError(row.error ?? "Failed to add")
      }
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(row: Row, active: boolean) {
    const res = await fetch(`/api/subscriptions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
    const updated = await res.json()
    if (res.ok) {
      setRows((r) => r.map((x) => (x.id === row.id ? updated : x)))
      router.refresh()
    }
  }

  async function remove(row: Row) {
    const res = await fetch(`/api/subscriptions/${row.id}`, { method: "DELETE" })
    if (res.ok) {
      setRows((r) => r.filter((x) => x.id !== row.id))
      router.refresh()
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ── Active monthly total — dark hero card ──────────────── */}
      <div
        style={{
          background: "#111110",
          border: "1px solid rgba(34,197,94,0.18)",
          borderRadius: "1rem",
          padding: "1.375rem 1.5rem",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Grain */}
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
        {/* Green glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-30%",
            left: "-10%",
            width: "60%",
            height: "160%",
            background:
              "radial-gradient(ellipse at center, rgba(34,197,94,0.1) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#22c55e",
              marginBottom: "0.25rem",
            }}
          >
            Active monthly total
          </p>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "#f0efe9",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMoney(monthlyTotal, currency)}
          </p>
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <RefreshCw style={{ width: "1.25rem", height: "1.25rem", color: "#22c55e" }} />
        </div>
      </div>

      {/* ── Add subscription form ─────────────────────────────── */}
      <div
        style={{
          background: "#111110",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1rem",
          padding: "1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grain */}
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
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(240,239,233,0.35)",
              marginBottom: "1rem",
            }}
          >
            Add subscription
          </p>
          <form
            onSubmit={add}
            style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "0.75rem" }}
          >
            {/* Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "rgba(240,239,233,0.45)",
                  marginBottom: "0.35rem",
                }}
              >
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Netflix"
                style={{ ...darkInput, width: "11rem" }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            {/* Amount */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "rgba(240,239,233,0.45)",
                  marginBottom: "0.35rem",
                }}
              >
                Amount / month
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="9.99"
                style={{ ...darkInput, width: "8rem" }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            {/* Renewal day */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "rgba(240,239,233,0.45)",
                  marginBottom: "0.35rem",
                }}
              >
                Renewal day
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={renewalDay}
                onChange={(e) => setRenewalDay(e.target.value)}
                style={{ ...darkInput, width: "5rem" }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                height: "2.25rem",
                padding: "0 1rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#22c55e",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#0d0d0c",
                fontFamily: "var(--font-geist-sans)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Plus style={{ width: "0.9rem", height: "0.9rem" }} />
              {loading ? "Adding…" : "Add"}
            </motion.button>
          </form>
          {error && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#f87171" }}>
              {error}
            </p>
          )}
        </div>
        <style>{`
          input::placeholder { color: rgba(240,239,233,0.22) !important; }
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button { opacity: 0.3; }
        `}</style>
      </div>

      {/* ── Subscription cards ────────────────────────────────── */}
      {rows.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No subscriptions yet"
          description="Add one above to start tracking."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {rows.map((r, i) => (
              <motion.div
                key={r.id}
                custom={i}
                variants={listItem}
                initial="hidden"
                animate="show"
                exit="exit"
                layout
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "1rem",
                  padding: "1.25rem",
                  opacity: r.active ? 1 : 0.45,
                  transition: "opacity 0.2s ease, border-color 0.2s ease",
                  WebkitFontSmoothing: "antialiased",
                }}
                onMouseEnter={(e) => {
                  if (r.active) {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.14)"
                  }
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(255,255,255,0.08)"
                }}
              >
                {/* Top row: name + amount + toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "#f0efe9",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.name}
                    </p>
                    <p
                      style={{
                        marginTop: "0.2rem",
                        fontSize: "1.375rem",
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                        color: "#f0efe9",
                      }}
                    >
                      {formatMoney(Number.parseFloat(r.amount), currency)}
                      <span
                        style={{
                          marginLeft: "0.375rem",
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          color: "rgba(240,239,233,0.35)",
                        }}
                      >
                        / mo
                      </span>
                    </p>
                  </div>
                  <Switch
                    checked={r.active ?? true}
                    onCheckedChange={(v) => toggleActive(r, v)}
                  />
                </div>

                {/* Bottom row: renewal day + delete */}
                <div
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.75rem",
                      color: "rgba(240,239,233,0.32)",
                    }}
                  >
                    <CalendarDays
                      style={{ width: "0.8rem", height: "0.8rem" }}
                    />
                    Renews day {r.renewal_day}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(r)}
                    style={{
                      width: "1.75rem",
                      height: "1.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "0.375rem",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "rgba(240,239,233,0.25)",
                      transition: "background 0.15s ease, color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.background = "rgba(248,113,113,0.1)"
                      el.style.color = "#f87171"
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.background = "transparent"
                      el.style.color = "rgba(240,239,233,0.25)"
                    }}
                  >
                    <Trash2 style={{ width: "0.8rem", height: "0.8rem" }} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
