"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarDays, Plus, RefreshCw, Trash2 } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { Switch } from "@/components/ui/switch"
import { formatMoney } from "@/lib/utils/parser"
import type { Database } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"
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
    () => rows.filter((r) => r.active).reduce((s, r) => s + Number.parseFloat(r.amount), 0),
    [rows]
  )

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
        setRows((r) => [...r, row].sort((a, b) => a.name.localeCompare(b.name)))
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
    <div className="space-y-5">
      {/* Active monthly total */}
      <div className="flex items-center justify-between rounded-2xl border border-penny-green/25 bg-penny-green-muted px-6 py-5 shadow-elevation-sm">
        <div>
          <p className="label-caps text-penny-green">Active monthly total</p>
          <p
            className="number-display mt-1 text-[32px] text-foreground"
            style={{ letterSpacing: "-0.02em" }}
          >
            {formatMoney(monthlyTotal, currency)}
          </p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-full bg-penny-green/15">
          <RefreshCw className="size-5 text-penny-green" aria-hidden />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm">
        <p className="mb-4 label-caps text-muted-foreground">Add subscription</p>
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix"
              className="h-9 w-44 rounded-lg border border-border bg-muted px-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow] focus:border-penny-green focus:bg-card focus:ring-3 focus:ring-penny-green/15"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Amount / month</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="9.99"
              className="h-9 w-32 rounded-lg border border-border bg-muted px-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow] focus:border-penny-green focus:bg-card focus:ring-3 focus:ring-penny-green/15"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Renewal day</label>
            <input
              type="number"
              min={1}
              max={31}
              value={renewalDay}
              onChange={(e) => setRenewalDay(e.target.value)}
              className="h-9 w-20 rounded-lg border border-border bg-muted px-3 text-[14px] text-foreground outline-none transition-[border-color,box-shadow] focus:border-penny-green focus:bg-card focus:ring-3 focus:ring-penny-green/15"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-penny-green px-4 text-[14px] font-medium text-white shadow-elevation-sm transition-colors hover:bg-penny-green-hover disabled:opacity-60"
          >
            <Plus className="size-4" aria-hidden />
            {loading ? "Adding…" : "Add"}
          </motion.button>
        </form>
        {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
      </div>

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
                className={cn(
                  "group rounded-2xl border border-border bg-card p-5 shadow-elevation-sm transition-[border-color,opacity,box-shadow] duration-200 hover:border-border-strong hover:shadow-elevation-md",
                  !r.active && "opacity-50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-foreground">{r.name}</p>
                    <p
                      className="mt-0.5 text-[22px] font-bold tabular-nums text-foreground"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {formatMoney(Number.parseFloat(r.amount), currency)}
                      <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
                        / mo
                      </span>
                    </p>
                  </div>
                  <Switch
                    checked={r.active ?? true}
                    onCheckedChange={(v) => toggleActive(r, v)}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <CalendarDays className="size-3.5" aria-hidden />
                    Renews day {r.renewal_day}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(r)}
                    className="flex size-7 items-center justify-center rounded-lg text-border-strong transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
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
