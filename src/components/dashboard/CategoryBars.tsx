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

const CATEGORY_META: Record<
  SpendCategory,
  {
    icon: React.ComponentType<{ style?: React.CSSProperties }>
    iconColor: string
    iconBg: string
    barColor: string
  }
> = {
  rent: {
    icon: Home,
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.12)",
    barColor: "#3B82F6",
  },
  groceries: {
    icon: ShoppingCart,
    iconColor: "#34d399",
    iconBg: "rgba(52,211,153,0.12)",
    barColor: "#059669",
  },
  food: {
    icon: UtensilsCrossed,
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,0.12)",
    barColor: "#F97316",
  },
  travel: {
    icon: Plane,
    iconColor: "#38bdf8",
    iconBg: "rgba(56,189,248,0.12)",
    barColor: "#0EA5E9",
  },
  subscriptions: {
    icon: RefreshCw,
    iconColor: "#a78bfa",
    iconBg: "rgba(167,139,250,0.12)",
    barColor: "#8B5CF6",
  },
  clothes: {
    icon: Shirt,
    iconColor: "#f472b6",
    iconBg: "rgba(244,114,182,0.12)",
    barColor: "#EC4899",
  },
  entertainment: {
    icon: Popcorn,
    iconColor: "#fbbf24",
    iconBg: "rgba(251,191,36,0.12)",
    barColor: "#D97706",
  },
  misc: {
    icon: CircleDot,
    iconColor: "rgba(240,239,233,0.42)",
    iconBg: "rgba(255,255,255,0.06)",
    barColor: "#78716c",
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
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1rem",
        padding: "1.5rem",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#f0efe9",
          }}
        >
          Spending by category
        </h3>
        <span
          style={{
            fontSize: "0.72rem",
            fontVariantNumeric: "tabular-nums",
            color: "rgba(240,239,233,0.3)",
          }}
        >
          {entries.length} categor{entries.length === 1 ? "y" : "ies"}
        </span>
      </div>

      {/* Category rows */}
      <ul style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {entries
          .sort((a, b) => b.v - a.v)
          .map(({ c, v }, idx) => {
            const meta = CATEGORY_META[c]
            const Icon = meta.icon
            const pct = totalSpent > 0 ? Math.round((v / totalSpent) * 100) : 0
            const barWidth = (v / max) * 100

            return (
              <li key={c}>
                <div
                  style={{
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        flexShrink: 0,
                        borderRadius: "0.5rem",
                        background: meta.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon style={{ width: "0.9rem", height: "0.9rem", color: meta.iconColor }} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        textTransform: "capitalize",
                        color: "rgba(240,239,233,0.82)",
                      }}
                    >
                      {c}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontVariantNumeric: "tabular-nums",
                        color: "rgba(240,239,233,0.3)",
                      }}
                    >
                      {pct}%
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        color: "#f0efe9",
                      }}
                    >
                      {formatMoney(v, currency)}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    height: "0.375rem",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.07)",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{
                      duration: 0.8,
                      ease: MOTION.easeOutSoft,
                      delay: 0.3 + idx * 0.06,
                    }}
                    style={{
                      height: "100%",
                      borderRadius: "9999px",
                      background: meta.barColor,
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
