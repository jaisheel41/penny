"use client"

import { motion } from "framer-motion"
import {
  Home,
  ShoppingCart,
  UtensilsCrossed,
  Plane,
  RefreshCw,
  Shirt,
  Popcorn,
  CircleDot,
} from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { SPEND_CATEGORIES, type SpendCategory } from "@/types"
import { formatMoney } from "@/lib/utils/parser"
import { MOTION } from "@/lib/motion/presets"
import { cn } from "@/lib/utils"

const CATEGORY_META: Record<
  SpendCategory,
  {
    icon: React.ComponentType<{ className?: string }>
    color: string
    barColor: string
    bg: string
  }
> = {
  rent: {
    icon: Home,
    color: "text-blue-600",
    barColor: "#3B82F6",
    bg: "bg-blue-50",
  },
  groceries: {
    icon: ShoppingCart,
    color: "text-emerald-600",
    barColor: "#059669",
    bg: "bg-emerald-50",
  },
  food: {
    icon: UtensilsCrossed,
    color: "text-orange-600",
    barColor: "#F97316",
    bg: "bg-orange-50",
  },
  travel: {
    icon: Plane,
    color: "text-sky-600",
    barColor: "#0EA5E9",
    bg: "bg-sky-50",
  },
  subscriptions: {
    icon: RefreshCw,
    color: "text-violet-600",
    barColor: "#8B5CF6",
    bg: "bg-violet-50",
  },
  clothes: {
    icon: Shirt,
    color: "text-pink-600",
    barColor: "#EC4899",
    bg: "bg-pink-50",
  },
  entertainment: {
    icon: Popcorn,
    color: "text-amber-600",
    barColor: "#D97706",
    bg: "bg-amber-50",
  },
  misc: {
    icon: CircleDot,
    color: "text-muted-foreground",
    barColor: "#a8a29e",
    bg: "bg-muted",
  },
}

export function CategoryBars(props: {
  currency: string
  byCategory: Partial<Record<SpendCategory, number>>
  totalSpent: number
}) {
  const { currency, byCategory, totalSpent } = props
  const entries = SPEND_CATEGORIES.map((c) => ({
    c,
    v: byCategory[c] ?? 0,
  })).filter((e) => e.v > 0)
  const max = Math.max(...entries.map((e) => e.v), 1)

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={CircleDot}
        title="No spending yet"
        description="Use the quick-add above to log your first expense."
        className="p-10"
      />
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-elevation-md">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
          Spending by category
        </h3>
        <span className="text-[12px] tabular-nums text-muted-foreground">
          {entries.length} categor{entries.length === 1 ? "y" : "ies"}
        </span>
      </div>

      <ul className="space-y-5">
        {entries
          .sort((a, b) => b.v - a.v)
          .map(({ c, v }, idx) => {
            const meta = CATEGORY_META[c]
            const Icon = meta.icon
            const pct = totalSpent > 0 ? Math.round((v / totalSpent) * 100) : 0
            const barWidth = (v / max) * 100

            return (
              <li key={c}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        meta.bg
                      )}
                    >
                      <Icon className={cn("size-4", meta.color)} />
                    </div>
                    <span className="text-[14px] font-medium capitalize text-foreground">
                      {c}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                    <span className="text-[14px] font-semibold tabular-nums text-foreground">
                      {formatMoney(v, currency)}
                    </span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{
                      duration: 0.8,
                      ease: MOTION.easeOutSoft,
                      delay: 0.3 + idx * 0.06,
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: meta.barColor }}
                  />
                </div>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
