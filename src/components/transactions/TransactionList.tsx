"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Pencil, Trash2, X } from "lucide-react"

import { formatMoney } from "@/lib/utils/parser"
import { SPEND_CATEGORIES, type SpendCategory } from "@/types"
import type { Database } from "@/lib/supabase/types"

type Row = Database["public"]["Tables"]["transactions"]["Row"]

// ── Dark modal overlay ───────────────────────────────────────────────────────
function DarkModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />
          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 101,
              width: "min(28rem, calc(100vw - 2rem))",
              background: "#111110",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#f0efe9",
                }}
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "1.875rem",
                  height: "1.875rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  color: "rgba(240,239,233,0.5)",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = "rgba(248,113,113,0.12)"
                  el.style.color = "#f87171"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = "rgba(255,255,255,0.06)"
                  el.style.color = "rgba(240,239,233,0.5)"
                }}
              >
                <X style={{ width: "0.875rem", height: "0.875rem" }} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Dark form field ──────────────────────────────────────────────────────────
const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(240,239,233,0.38)",
  marginBottom: "0.4rem",
}
const fieldInput: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  padding: "0.5625rem 0.75rem",
  fontSize: "0.875rem",
  color: "#f0efe9",
  outline: "none",
  fontFamily: "var(--font-geist-sans)",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  boxSizing: "border-box",
}

// ── Category badge colours ───────────────────────────────────────────────────
const CAT_COLORS: Record<string, { text: string; bg: string }> = {
  rent:          { text: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  groceries:     { text: "#34d399", bg: "rgba(52,211,153,0.12)" },
  food:          { text: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  travel:        { text: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  subscriptions: { text: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  clothes:       { text: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  entertainment: { text: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  misc:          { text: "rgba(240,239,233,0.42)", bg: "rgba(255,255,255,0.07)" },
}

export function TransactionList({
  initial,
  month,
  category = "",
  currency = "GBP",
}: {
  initial: Row[]
  month: string
  category?: string
  currency?: string
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    setRows(initial)
  }, [initial])

  async function refresh() {
    const q = new URLSearchParams({ month })
    if (category) q.set("category", category)
    const res = await fetch(`/api/transactions?${q.toString()}`)
    const data = await res.json()
    if (res.ok) setRows(data)
    router.refresh()
  }

  async function saveEdit() {
    if (!editing) return
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: editing.merchant,
          amount: Number(editing.amount),
          category: editing.category,
          note: editing.note,
          date: editing.date,
        }),
      })
      if (res.ok) {
        setEditing(null)
        await refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/${deleting.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDeleting(null)
        await refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  function focusStyle(field: string): React.CSSProperties {
    return focusedField === field
      ? {
          ...fieldInput,
          borderColor: "rgba(34,197,94,0.5)",
          boxShadow: "0 0 0 3px rgba(34,197,94,0.08)",
        }
      : fieldInput
  }

  return (
    <>
      {/* ── Transaction table ──────────────────────────────────────── */}
      <div
        style={{
          overflow: "hidden",
          borderRadius: "0.875rem",
          border: "1px solid rgba(255,255,255,0.08)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr
              style={{
                background: "rgba(255,255,255,0.04)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {["Date", "Merchant", "Category", "Amount", ""].map((h, i) => (
                <th
                  key={h + i}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: i >= 3 ? "right" : "left",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    color: "rgba(240,239,233,0.3)",
                    whiteSpace: "nowrap",
                  }}
                  className={i === 2 ? "hidden sm:table-cell" : ""}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "3rem 1rem",
                    textAlign: "center",
                    color: "rgba(240,239,233,0.28)",
                    fontSize: "0.875rem",
                  }}
                >
                  No transactions this month.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const catColor = CAT_COLORS[r.category] ?? CAT_COLORS.misc
                return (
                  <tr
                    key={r.id}
                    style={{
                      background:
                        idx % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent",
                      borderBottom:
                        idx < rows.length - 1
                          ? "1px solid rgba(255,255,255,0.05)"
                          : "none",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.background =
                        "rgba(255,255,255,0.04)"
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.background =
                        idx % 2 === 1
                          ? "rgba(255,255,255,0.015)"
                          : "transparent"
                    }}
                  >
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        fontVariantNumeric: "tabular-nums",
                        fontSize: "0.8rem",
                        color: "rgba(240,239,233,0.38)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.date}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        fontWeight: 500,
                        color: "#f0efe9",
                        maxWidth: "12rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.merchant}
                    </td>
                    <td
                      className="hidden sm:table-cell"
                      style={{ padding: "0.75rem 1rem" }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.2rem 0.625rem",
                          borderRadius: "9999px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                          color: catColor.text,
                          background: catColor.bg,
                        }}
                      >
                        {r.category}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "right",
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        color: "#f0efe9",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatMoney(Number.parseFloat(r.amount), currency)}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div style={{ display: "inline-flex", gap: "0.25rem" }}>
                        <button
                          type="button"
                          onClick={() => setEditing({ ...r })}
                          style={{
                            width: "1.875rem",
                            height: "1.875rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "0.4rem",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "rgba(240,239,233,0.3)",
                            transition: "background 0.15s ease, color 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLButtonElement
                            el.style.background = "rgba(255,255,255,0.07)"
                            el.style.color = "#f0efe9"
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLButtonElement
                            el.style.background = "transparent"
                            el.style.color = "rgba(240,239,233,0.3)"
                          }}
                        >
                          <Pencil style={{ width: "0.8rem", height: "0.8rem" }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(r)}
                          style={{
                            width: "1.875rem",
                            height: "1.875rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "0.4rem",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "rgba(240,239,233,0.3)",
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
                            el.style.color = "rgba(240,239,233,0.3)"
                          }}
                        >
                          <Trash2 style={{ width: "0.8rem", height: "0.8rem" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Edit modal ─────────────────────────────────────────────── */}
      <DarkModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit transaction"
      >
        {editing && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label style={fieldLabel}>Merchant</label>
              <input
                value={editing.merchant}
                onChange={(e) => setEditing({ ...editing, merchant: e.target.value })}
                style={focusStyle("merchant")}
                onFocus={() => setFocusedField("merchant")}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            <div>
              <label style={fieldLabel}>Amount</label>
              <input
                type="number"
                step="0.01"
                value={editing.amount}
                onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
                style={focusStyle("amount")}
                onFocus={() => setFocusedField("amount")}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            <div>
              <label style={fieldLabel}>Category</label>
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value as SpendCategory })
                }
                style={{
                  ...focusStyle("category"),
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
                onFocus={() => setFocusedField("category")}
                onBlur={() => setFocusedField(null)}
              >
                {SPEND_CATEGORIES.map((c) => (
                  <option
                    key={c}
                    value={c}
                    style={{ background: "#111110", color: "#f0efe9", textTransform: "capitalize" }}
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Date</label>
              <input
                type="date"
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                style={focusStyle("date")}
                onFocus={() => setFocusedField("date")}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.625rem",
                justifyContent: "flex-end",
                marginTop: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => setEditing(null)}
                style={{
                  padding: "0.5625rem 1.125rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "rgba(240,239,233,0.55)",
                  fontFamily: "var(--font-geist-sans)",
                  transition: "background 0.15s ease",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={loading}
                style={{
                  padding: "0.5625rem 1.375rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "#22c55e",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#0d0d0c",
                  fontFamily: "var(--font-geist-sans)",
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.15s ease",
                }}
              >
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}
        <style>{`
          input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
          select option { background: #111110; }
        `}</style>
      </DarkModal>

      {/* ── Delete confirm modal ───────────────────────────────────── */}
      <DarkModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete transaction?"
      >
        <p
          style={{
            fontSize: "0.875rem",
            color: "rgba(240,239,233,0.48)",
            lineHeight: 1.65,
            marginBottom: "1.25rem",
          }}
        >
          <strong style={{ color: "#f0efe9", fontWeight: 600 }}>
            {deleting?.merchant}
          </strong>{" "}
          — {deleting ? formatMoney(Number.parseFloat(deleting.amount), currency) : ""}.
          This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => setDeleting(null)}
            style={{
              padding: "0.5625rem 1.125rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "rgba(240,239,233,0.55)",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={loading}
            style={{
              padding: "0.5625rem 1.375rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "rgba(248,113,113,0.15)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "#f87171",
              fontFamily: "var(--font-geist-sans)",
              opacity: loading ? 0.6 : 1,
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(248,113,113,0.25)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                "rgba(248,113,113,0.15)"
            }}
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </DarkModal>
    </>
  )
}
