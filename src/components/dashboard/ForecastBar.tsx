import { TrendingUp, AlertTriangle, ArrowRight } from "lucide-react"

import { formatMoney } from "@/lib/utils/parser"
import { cn } from "@/lib/utils"

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
  const over = monthlyIncome > 0 && projectedTotal > monthlyIncome
  const pct =
    monthlyIncome > 0
      ? Math.min(100, Math.round((totalSpent / monthlyIncome) * 100))
      : 0

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 shadow-sm transition-colors",
        over
          ? "border-destructive/30 bg-gradient-to-br from-destructive/5 via-background to-destructive/[0.02]"
          : "bg-gradient-to-br from-emerald-500/5 via-background to-emerald-500/[0.02]"
      )}
    >
      <div className="absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br from-emerald-500/8 to-transparent blur-2xl dark:from-emerald-500/5" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {over ? (
              <AlertTriangle className="size-4 text-destructive" />
            ) : (
              <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <h3 className="text-sm font-semibold text-muted-foreground">
              Month-end forecast
            </h3>
          </div>
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {formatMoney(projectedTotal, currency)}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="tabular-nums">
              {formatMoney(dailyRate, currency)}/day
            </span>
            <span className="text-border">|</span>
            <span>{daysRemaining} days left</span>
          </div>
        </div>

        {monthlyIncome > 0 && (
          <div className="flex flex-col items-end gap-1 text-right">
            <p className="text-xs font-medium text-muted-foreground">
              Income target
            </p>
            <p className="text-lg font-semibold tabular-nums">
              {formatMoney(monthlyIncome, currency)}
            </p>
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-semibold",
                over
                  ? "text-destructive"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {over ? (
                <>
                  <AlertTriangle className="size-3" />
                  Over by{" "}
                  {formatMoney(projectedTotal - monthlyIncome, currency)}
                </>
              ) : (
                <>
                  <ArrowRight className="size-3" />
                  {formatMoney(monthlyIncome - projectedTotal, currency)} buffer
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {monthlyIncome > 0 && (
        <div className="relative mt-4">
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                over
                  ? "bg-gradient-to-r from-destructive/80 to-destructive"
                  : pct >= 70
                    ? "bg-gradient-to-r from-amber-400 to-amber-500"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>{formatMoney(totalSpent, currency)} spent</span>
            <span>{pct}% of income</span>
          </div>
        </div>
      )}
    </div>
  )
}
