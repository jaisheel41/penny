"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Receipt } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { formatMoney } from "@/lib/utils/parser"
import { MOTION } from "@/lib/motion/presets"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/supabase/types"

type Row = Database["public"]["Tables"]["transactions"]["Row"]

const CATEGORY_EMOJI: Record<string, string> = {
  groceries: "🛒",
  food: "🍕",
  travel: "✈️",
  subscriptions: "🔄",
  entertainment: "🎬",
  clothes: "👗",
  rent: "🏠",
  misc: "💳",
}

const CATEGORY_BG: Record<string, string> = {
  groceries: "bg-emerald-50",
  food: "bg-orange-50",
  travel: "bg-sky-50",
  subscriptions: "bg-violet-50",
  entertainment: "bg-amber-50",
  clothes: "bg-pink-50",
  rent: "bg-blue-50",
  misc: "bg-muted",
}

export function RecentTransactions({
  rows,
  currency,
}: {
  rows: Row[]
  currency: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-elevation-sm transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-elevation-md">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
          Recent transactions
        </h3>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-[13px] font-medium text-penny-green transition-colors hover:text-penny-green-hover"
        >
          View all
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 pb-2">
          <EmptyState
            icon={Receipt}
            title="No spending logged yet"
            description='Add your first expense above — try "Coffee £3.50"'
            className="border-none bg-transparent py-10 shadow-none"
          />
        </div>
      ) : (
        <ul className="px-2 py-2">
          {rows.slice(0, 6).map((r, i) => {
            const cat = r.category ?? "misc"
            const emoji = CATEGORY_EMOJI[cat] ?? "💳"
            const bgClass = CATEGORY_BG[cat] ?? "bg-muted"
            const amount = Number.parseFloat(r.amount)

            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.25,
                  ease: MOTION.easeOutSoft,
                }}
                className="group flex cursor-default items-center gap-4 rounded-xl px-4 py-3.5 transition-colors duration-150 hover:bg-muted"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-[18px]",
                    bgClass
                  )}
                >
                  {emoji}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-foreground">{r.merchant}</p>
                  <p className="text-[12px] text-muted-foreground">
                    <span className="capitalize">{cat}</span>
                    <span className="mx-1.5">·</span>
                    {r.date}
                  </p>
                </div>

                <span className="ml-2 shrink-0 text-[14px] font-semibold tabular-nums text-foreground">
                  {formatMoney(amount, currency)}
                </span>
              </motion.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
