"use client"

import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

import { parseSpendLine } from "@/lib/utils/parser"
import { cn } from "@/lib/utils"
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
      className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-elevation-md"
    >
      <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <p className="label-caps text-muted-foreground">Quick add</p>
        <p className="text-xs text-muted-foreground sm:text-right">
          Natural language — we parse amount and merchant for you.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-full border-[1.5px] border-border bg-surface-raised px-5 py-3.5 transition-[border-color,box-shadow] duration-200",
            focused && "border-penny-green ring-4 ring-penny-green/10"
          )}
        >
          <input
            ref={inputRef}
            value={line}
            onChange={(e) => setLine(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder='Try "Deliveroo £18" or "Coffee £3.50"'
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />

          <AnimatePresence>
            {parsed && (
              <motion.span
                key="preview"
                initial={r ? false : { opacity: 0, scale: 0.85, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={r ? undefined : { opacity: 0, scale: 0.85, x: 8 }}
                transition={{ duration: MOTION.fast }}
                className="hidden shrink-0 items-center gap-1.5 rounded-full border border-penny-green/30 bg-penny-green-muted px-3 py-1 text-[12px] font-medium text-penny-green sm:flex"
              >
                <span>{parsed.merchant}</span>
                <span className="text-penny-green/40">·</span>
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
                className="shrink-0 rounded-full bg-penny-green px-4 py-1.5 text-[13px] font-medium text-white shadow-elevation-sm transition-colors hover:bg-penny-green-hover disabled:opacity-60"
              >
                {loading ? "Adding…" : "Add"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={r ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={r ? undefined : { opacity: 0 }}
            className="mt-2 text-[13px] text-destructive"
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
            className="mt-2 text-[13px] font-medium text-penny-green"
          >
            ✓ Added successfully
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
