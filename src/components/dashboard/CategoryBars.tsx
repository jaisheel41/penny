import {
  Home,
  UtensilsCrossed,
  Plane,
  RefreshCw,
  Shirt,
  Popcorn,
  CircleDot,
} from "lucide-react"

import { SPEND_CATEGORIES, type SpendCategory } from "@/types"
import { formatMoney } from "@/lib/utils/parser"
import { cn } from "@/lib/utils"

const CATEGORY_META: Record<
  SpendCategory,
  { icon: React.ComponentType<{ className?: string }>; color: string; gradient: string }
> = {
  rent: {
    icon: Home,
    color: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500 to-blue-600",
  },
  food: {
    icon: UtensilsCrossed,
    color: "text-orange-600 dark:text-orange-400",
    gradient: "from-orange-400 to-orange-500",
  },
  travel: {
    icon: Plane,
    color: "text-sky-600 dark:text-sky-400",
    gradient: "from-sky-400 to-sky-500",
  },
  subscriptions: {
    icon: RefreshCw,
    color: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-400 to-violet-500",
  },
  clothes: {
    icon: Shirt,
    color: "text-pink-600 dark:text-pink-400",
    gradient: "from-pink-400 to-pink-500",
  },
  entertainment: {
    icon: Popcorn,
    color: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-400 to-amber-500",
  },
  misc: {
    icon: CircleDot,
    color: "text-slate-600 dark:text-slate-400",
    gradient: "from-slate-400 to-slate-500",
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
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-10 text-center shadow-sm">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <CircleDot className="size-5 text-muted-foreground" />
        </div>
        <p className="font-medium">No spending yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the quick-add input above to log your first expense.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Spending by category</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {entries.length} categor{entries.length === 1 ? "y" : "ies"}
        </span>
      </div>
      <ul className="space-y-4">
        {entries
          .sort((a, b) => b.v - a.v)
          .map(({ c, v }) => {
            const meta = CATEGORY_META[c]
            const Icon = meta.icon
            const pct = totalSpent > 0 ? Math.round((v / totalSpent) * 100) : 0
            return (
              <li key={c} className="group">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-muted/80",
                        meta.color
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <span className="text-sm font-medium capitalize">
                      {c}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(v, currency)}
                    </span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                      meta.gradient
                    )}
                    style={{
                      width: `${Math.min(100, (v / max) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
