"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Target, Trash2 } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { formatMoney } from "@/lib/utils/parser"
import { SPEND_CATEGORIES, type SpendCategory } from "@/types"
import type { Database } from "@/lib/supabase/types"
import { MOTION } from "@/lib/motion/presets"

type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"]

const CATEGORY_COLOR: Record<string, { bar: string; text: string; bg: string; icon: string }> = {
  groceries:     { bar: "#059669", text: "#34d399", bg: "rgba(52,211,153,0.1)",  icon: "🛒" },
  food:          { bar: "#F97316", text: "#fb923c", bg: "rgba(251,146,60,0.1)",  icon: "🍕" },
  rent:          { bar: "#3B82F6", text: "#60a5fa", bg: "rgba(96,165,250,0.1)",  icon: "🏠" },
  travel:        { bar: "#0EA5E9", text: "#38bdf8", bg: "rgba(56,189,248,0.1)",  icon: "✈️" },
  subscriptions: { bar: "#8B5CF6", text: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "🔄" },
  clothes:       { bar: "#EC4899", text: "#f472b6", bg: "rgba(244,114,182,0.1)", icon: "👗" },
  entertainment: { bar: "#D97706", text: "#fbbf24", bg: "rgba(251,191,36,0.1)",  icon: "🎬" },
  misc:          { bar: "#78716c", text: "rgba(240,239,233,0.42)", bg: "rgba(255,255,255,0.06)", icon: "💳" },
}

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

export function BudgetsClient({
  currency,
  month,
  initialBudgets,
  spentByCategory,
}: {
  currency: string
  month: string
  initialBudgets: BudgetRow[]
  spentByCategory: Partial<Record<SpendCategory, number>>
}) {
  const router = useRouter()
  const [budgets, setBudgets] = useState(initialBudgets)
  const [category, setCategory] = useState<SpendCategory>("food")
  const [limit, setLimit] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addBudget(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const monthly_limit = Number(limit)
    if (!Number.isFinite(monthly_limit) || monthly_limit <= 0) return
    setLoading(true)
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, monthly_limit, month }),
      })
      const row = await res.json()
      if (res.ok) {
        setBudgets((prev) => [
          ...prev.filter((b) => b.category !== row.category),
          row,
        ])
        setLimit("")
        router.refresh()
      } else {
        setError(row.error ?? "Failed to add")
      }
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" })
    if (res.ok) {
      setBudgets((b) => b.filter((x) => x.id !== id))
      router.refresh()
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", WebkitFontSmoothing: "antialiased" }}>

      {/* ── Add budget form ──────────────────────────────────────── */}
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
            Set a budget
          </p>
          <form
            onSubmit={addBudget}
            style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "0.75rem" }}
          >
            {/* Category */}
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
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SpendCategory)}
                style={{
                  ...darkInput,
                  width: "11rem",
                  appearance: "none",
                  WebkitAppearance: "none",
                  paddingRight: "2rem",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(240,239,233,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.6rem center",
                }}
              >
                {SPEND_CATEGORIES.map((c) => (
                  <option
                    key={c}
                    value={c}
                    style={{ background: "#111110", color: "#f0efe9" }}
                  >
                    {CATEGORY_COLOR[c]?.icon ?? "💳"} {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly limit */}
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
                Monthly limit
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                style={{ ...darkInput, width: "9rem" }}
                onFocus={(e) => {
                  ;(e.target as HTMLInputElement).style.borderColor =
                    "rgba(34,197,94,0.5)"
                  ;(e.target as HTMLInputElement).style.boxShadow =
                    "0 0 0 3px rgba(34,197,94,0.08)"
                }}
                onBlur={(e) => {
                  ;(e.target as HTMLInputElement).style.borderColor =
                    "rgba(255,255,255,0.1)"
                  ;(e.target as HTMLInputElement).style.boxShadow = "none"
                }}
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
              {loading ? "Saving…" : "Add budget"}
            </motion.button>
          </form>
          {error && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.8rem",
                color: "#f87171",
              }}
            >
              {error}
            </p>
          )}
        </div>
        <style>{`
          select option { background: #111110; }
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button { opacity: 0.3; }
          input::placeholder { color: rgba(240,239,233,0.22) !important; }
        `}</style>
      </div>

      {/* ── Budget cards ─────────────────────────────────────────── */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title={`No budgets for ${month}`}
          description="Set a monthly limit above to start tracking."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {budgets.map((b, i) => {
              const spent = spentByCategory[b.category as SpendCategory] ?? 0
              const lim = Number.parseFloat(b.monthly_limit)
              const pct = lim > 0 ? Math.min(100, (spent / lim) * 100) : 0
              const over = pct >= 100
              const hot = pct >= 90 && !over
              const warm = pct >= 70 && pct < 90
              const cat = CATEGORY_COLOR[b.category] ?? CATEGORY_COLOR.misc
              const barColor = over || hot ? "#f87171" : warm ? "#d97706" : cat.bar

              return (
                <motion.div
                  key={b.id}
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
                    transition: "border-color 0.2s ease",
                    WebkitFontSmoothing: "antialiased",
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.14)"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.08)"
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                      }}
                    >
                      <span
                        style={{
                          width: "2.25rem",
                          height: "2.25rem",
                          borderRadius: "0.5rem",
                          background: cat.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      >
                        {cat.icon}
                      </span>
                      <span
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                          color: "#f0efe9",
                        }}
                      >
                        {b.category}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                      }}
                    >
                      {(over || hot) && (
                        <span
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            background: "rgba(248,113,113,0.12)",
                            color: "#f87171",
                          }}
                        >
                          {over ? "Over" : "Near limit"}
                        </span>
                      )}
                      {warm && (
                        <span
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            background: "rgba(217,119,6,0.12)",
                            color: "#d97706",
                          }}
                        >
                          Watch out
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(b.id)}
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
                  </div>

                  {/* Amounts */}
                  <div
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.03em",
                        color: barColor,
                      }}
                    >
                      {formatMoney(spent, currency)}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(240,239,233,0.35)",
                      }}
                    >
                      of {formatMoney(lim, currency)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      marginTop: "0.75rem",
                      height: "0.375rem",
                      borderRadius: "9999px",
                      overflow: "hidden",
                      background: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.8,
                        ease: MOTION.easeOutSoft,
                        delay: i * 0.06,
                      }}
                      style={{
                        height: "100%",
                        borderRadius: "9999px",
                        background: barColor,
                      }}
                    />
                  </div>
                  <p
                    style={{
                      marginTop: "0.375rem",
                      textAlign: "right",
                      fontSize: "0.68rem",
                      fontVariantNumeric: "tabular-nums",
                      color: "rgba(240,239,233,0.28)",
                    }}
                  >
                    {pct.toFixed(0)}% used
                  </p>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
