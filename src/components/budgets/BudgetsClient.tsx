"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Target, Trash2 } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { formatMoney } from "@/lib/utils/parser"
import { SPEND_CATEGORIES, type SpendCategory } from "@/types"
import type { Database } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"
import { MOTION } from "@/lib/motion/presets"

type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"]

const CATEGORY_BAR: Record<string, string> = {
  groceries: "#059669",
  food: "#F97316",
  rent: "#3B82F6",
  travel: "#0EA5E9",
  subscriptions: "#8B5CF6",
  clothes: "#EC4899",
  entertainment: "#D97706",
  misc: "#A8A29E",
}

const CATEGORY_ICON: Record<string, string> = {
  groceries: "🛒",
  food: "🍕",
  rent: "🏠",
  travel: "✈️",
  subscriptions: "🔄",
  clothes: "👗",
  entertainment: "🎬",
  misc: "💳",
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
        setBudgets((prev) => [...prev.filter((b) => b.category !== row.category), row])
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
    <div className="space-y-5">
      {/* Add form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm">
        <p className="mb-4 label-caps text-muted-foreground">Set a budget</p>
        <form onSubmit={addBudget} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as SpendCategory)}>
              <SelectTrigger className="h-9 w-44 rounded-lg border-border bg-muted text-[14px] focus:border-penny-green focus:ring-penny-green/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEND_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {CATEGORY_ICON[c]} {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Monthly limit</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="h-9 w-36 rounded-lg border border-border bg-muted px-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow] focus:border-penny-green focus:bg-card focus:ring-3 focus:ring-penny-green/15"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-penny-green px-4 text-[14px] font-medium text-white shadow-elevation-sm transition-colors hover:bg-penny-green-hover disabled:opacity-60"
          >
            <Plus className="size-4" />
            {loading ? "Saving…" : "Add budget"}
          </motion.button>
        </form>
        {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
      </div>

      {/* Budget cards */}
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
              const barColor = over
                ? "#DC2626"
                : hot
                  ? "#DC2626"
                  : warm
                    ? "#D97706"
                    : CATEGORY_BAR[b.category] ?? "#A8A29E"

              return (
                <motion.div
                  key={b.id}
                  custom={i}
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  layout
                  className="group rounded-2xl border border-border bg-card p-5 shadow-elevation-sm transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-elevation-md"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[22px]">{CATEGORY_ICON[b.category] ?? "💳"}</span>
                      <span className="text-[15px] font-semibold capitalize text-foreground">
                        {b.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {over && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                          Over
                        </span>
                      )}
                      {hot && !over && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                          Near limit
                        </span>
                      )}
                      {warm && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-penny-amber dark:bg-amber-950/40">
                          Watch out
                        </span>
                      )}
                      <button
                        onClick={() => remove(b.id)}
                        className="flex size-7 items-center justify-center rounded-lg text-border-strong transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <span
                      className="text-[22px] font-bold tabular-nums"
                      style={{ letterSpacing: "-0.02em", color: barColor }}
                    >
                      {formatMoney(spent, currency)}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      of {formatMoney(lim, currency)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.8,
                        ease: MOTION.easeOutSoft,
                        delay: i * 0.06,
                      }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-[12px] tabular-nums text-muted-foreground">
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
