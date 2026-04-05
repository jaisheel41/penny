"use client"

import { motion, useReducedMotion } from "framer-motion"
import { TrendingUp, AlertTriangle, ArrowRight } from "lucide-react"
import CountUp from "react-countup"

import { formatMoney } from "@/lib/utils/parser"
import { cn } from "@/lib/utils"
import { MOTION } from "@/lib/motion/presets"

export function ForecastBar(props: {
  currency: string
  projectedTotal: number
  monthlyIncome: number
  dailyRate: number
  daysRemaining: number
  totalSpent: number
}) {
  const {
    currency,
    projectedTotal,
    monthlyIncome,
    dailyRate,
    daysRemaining,
    totalSpent,
  } = props

  const reduceMotion = useReducedMotion()
  const r = reduceMotion === true

  const over = monthlyIncome > 0 && projectedTotal > monthlyIncome
  const pct =
    monthlyIncome > 0
      ? Math.min(100, (totalSpent / monthlyIncome) * 100)
      : 0

  const barColor = over ? "var(--penny-danger)" : pct >= 70 ? "var(--penny-amber)" : "var(--penny-green)"

  let narrative = ""
  if (monthlyIncome <= 0) {
    narrative = "Set monthly income in Settings to compare spend against what you earn."
  } else if (over) {
    narrative = "At your current daily pace, month-end spend is projected to go over income."
  } else if (pct >= 85) {
    narrative = "You have used most of this month’s income—discretionary room is tight."
  } else if (pct >= 70) {
    narrative = "You are past the halfway mark; keep an eye on variable categories."
  } else {
    narrative = "You are pacing under your income for the month so far."
  }

  return (
    <motion.div
      whileHover={r ? undefined : { scale: 1.005 }}
      transition={{ duration: MOTION.fast }}
      className={cn(
        "rounded-2xl border p-6 shadow-elevation-sm transition-[border-color,box-shadow] duration-200",
        over
          ? "border-destructive/25 bg-destructive/5 hover:border-destructive/40 hover:shadow-elevation-md"
          : "border-border bg-card hover:border-border-strong hover:shadow-elevation-md"
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        {over ? (
          <AlertTriangle className="size-4 text-destructive" aria-hidden />
        ) : (
          <TrendingUp className="size-4 text-penny-green" aria-hidden />
        )}
        <p className="label-caps text-muted-foreground">Month-end forecast</p>
      </div>

      <p className="number-display mt-2 text-[36px] leading-none text-foreground">
        <CountUp
          end={projectedTotal}
          duration={r ? 0 : 1.2}
          decimals={2}
          formattingFn={(n) => formatMoney(n, currency)}
          enableScrollSpy
          scrollSpyOnce
        />
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
        <span className="tabular-nums">{formatMoney(dailyRate, currency)}/day</span>
        <span className="text-border-strong">·</span>
        <span>{daysRemaining} days left</span>
        {monthlyIncome > 0 && (
          <span
            className={cn(
              "ml-auto flex items-center gap-1 text-[12px] font-semibold",
              over ? "text-destructive" : "text-penny-green"
            )}
          >
            {over ? (
              <>
                <AlertTriangle className="size-3" aria-hidden />
                Over by {formatMoney(projectedTotal - monthlyIncome, currency)}
              </>
            ) : (
              <>
                <ArrowRight className="size-3" aria-hidden />
                {formatMoney(monthlyIncome - projectedTotal, currency)} buffer
              </>
            )}
          </span>
        )}
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{narrative}</p>

      {monthlyIncome > 0 && (
        <div className="mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={r ? { width: `${pct}%` } : { width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{
                duration: r ? 0 : 1.2,
                ease: "easeOut",
                delay: r ? 0 : 0.4,
              }}
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] tabular-nums">
            <span className="font-medium" style={{ color: barColor }}>
              {formatMoney(totalSpent, currency)} spent
            </span>
            <span className="text-muted-foreground">{Math.round(pct)}% of income</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
