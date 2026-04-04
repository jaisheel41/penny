import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { format } from "date-fns"

import { QuickAdd } from "@/components/dashboard/QuickAdd"
import { CategoryBars } from "@/components/dashboard/CategoryBars"
import { ForecastBar } from "@/components/dashboard/ForecastBar"
import { MonthlyPulse } from "@/components/dashboard/MonthlyPulse"
import { StatCard } from "@/components/dashboard/StatCard"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  currentMonthKey,
  foodWeekOverWeekDeltaPct,
  monthBounds,
  sumByCategory,
} from "@/lib/dashboard/aggregates"
import { buildMonthlyPulse } from "@/lib/utils/monthly-pulse"
import { projectMonthEndSpend } from "@/lib/utils/forecast"
import { formatMoney } from "@/lib/utils/parser"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import type { SpendCategory } from "@/types"

function prevMonthKey(month: string): string {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(y, m - 2, 1)
  return format(d, "yyyy-MM")
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  const currency =
    profile?.currency && profile.currency.length === 3 ? profile.currency : "GBP"
  const monthlyIncome = profile?.monthly_income
    ? Number.parseFloat(profile.monthly_income)
    : 0

  const month = currentMonthKey()
  const { start, end } = monthBounds(month)

  const { data: txRows } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  const rows = txRows ?? []
  let monthTotal = 0
  for (const r of rows) {
    monthTotal += Number.parseFloat(r.amount)
  }

  const byCategory = sumByCategory(rows)

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("amount")
    .eq("user_id", user.id)
    .eq("active", true)

  const subTotal = (subs ?? []).reduce(
    (s, r) => s + Number.parseFloat(r.amount),
    0
  )

  const ref = new Date()
  const { projectedTotal, dailyRate, daysRemaining } = projectMonthEndSpend({
    monthToDateSpend: monthTotal,
    referenceDate: ref,
    subscriptionMonthlyTotal: subTotal,
  })

  const foodDelta = foodWeekOverWeekDeltaPct(rows, ref)
  const categoryDeltaPct: Partial<Record<SpendCategory, number>> = {}
  if (foodDelta !== undefined) categoryDeltaPct.food = foodDelta

  const pulseText = buildMonthlyPulse({
    currencyCode: currency,
    totalSpent: monthTotal,
    byCategory,
    categoryDeltaPct,
  })

  const displayMonth = format(new Date(month + "-01"), "MMMM yyyy")
  const greeting = getGreeting(profile?.name ?? undefined)

  // --- Insights MoM data ---
  const lastMonth = prevMonthKey(month)
  const { start: prevStart, end: prevEnd } = monthBounds(lastMonth)
  const { data: prevTxRows } = await supabase
    .from("transactions")
    .select("amount, category")
    .eq("user_id", user.id)
    .gte("date", prevStart)
    .lte("date", prevEnd)

  const prevRows = prevTxRows ?? []
  let prevTotal = 0
  for (const r of prevRows) prevTotal += Number.parseFloat(r.amount)
  const prevByCategory = sumByCategory(prevRows)

  const momDelta =
    prevTotal > 0
      ? ((monthTotal - prevTotal) / prevTotal) * 100
      : monthTotal > 0
        ? 100
        : 0

  let biggestSwing: { cat: SpendCategory; change: number } | null = null
  for (const c of Object.keys(byCategory) as SpendCategory[]) {
    const a = byCategory[c] ?? 0
    const b = prevByCategory[c] ?? 0
    const ch = b > 0 ? ((a - b) / b) * 100 : a > 0 ? 100 : 0
    if (!biggestSwing || Math.abs(ch) > Math.abs(biggestSwing.change)) {
      biggestSwing = { cat: c, change: ch }
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/[0.06] via-background to-primary/[0.03] px-6 py-5 shadow-sm">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 size-24 rounded-full bg-primary/3 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s how {displayMonth} is shaping up.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Spent this month"
          value={formatMoney(monthTotal, currency)}
          subtitle={`${rows.length} transaction${rows.length !== 1 ? "s" : ""}`}
          icon={Wallet}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          title="Daily average"
          value={formatMoney(dailyRate, currency)}
          subtitle={`${daysRemaining} days remaining`}
          icon={CalendarDays}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          title="Subscriptions"
          value={formatMoney(subTotal, currency)}
          subtitle={`${(subs ?? []).length} active`}
          icon={RefreshCw}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-500/10"
        />
        <StatCard
          title="Transactions"
          value={String(rows.length)}
          subtitle={displayMonth}
          icon={Receipt}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-500/10"
        />
      </div>

      <QuickAdd />

      <div className="grid gap-4 lg:grid-cols-2">
        <ForecastBar
          currency={currency}
          projectedTotal={projectedTotal}
          monthlyIncome={monthlyIncome}
          dailyRate={dailyRate}
          daysRemaining={daysRemaining}
          totalSpent={monthTotal}
        />
        <MonthlyPulse text={pulseText} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBars
          currency={currency}
          byCategory={byCategory}
          totalSpent={monthTotal}
        />
        <RecentTransactions rows={rows} currency={currency} />
      </div>

      {/* Month-over-month insights */}
      <Card className="border-primary/15">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {momDelta <= 0 ? (
              <TrendingDown className="size-4 text-emerald-600" />
            ) : (
              <TrendingUp className="size-4 text-destructive" />
            )}
            Month-over-Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                This month ({month})
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(monthTotal, currency)}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${
                      Math.max(monthTotal, prevTotal) > 0
                        ? (monthTotal / Math.max(monthTotal, prevTotal)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-2 rounded-lg bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Last month ({lastMonth})
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(prevTotal, currency)}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-muted-foreground/30 transition-all"
                  style={{
                    width: `${
                      Math.max(monthTotal, prevTotal) > 0
                        ? (prevTotal / Math.max(monthTotal, prevTotal)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium",
                momDelta > 0
                  ? "bg-destructive/10 text-destructive"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              )}
            >
              {momDelta > 0 ? (
                <ArrowUp className="size-3.5" />
              ) : (
                <ArrowDown className="size-3.5" />
              )}
              {momDelta >= 0 ? "+" : ""}
              {momDelta.toFixed(0)}% vs last month
            </span>
            {biggestSwing && (
              <span className="text-muted-foreground">
                Largest swing:{" "}
                <span className="capitalize font-medium text-foreground">
                  {biggestSwing.cat}
                </span>{" "}
                ({biggestSwing.change >= 0 ? "+" : ""}
                {biggestSwing.change.toFixed(0)}%)
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getGreeting(name?: string): string {
  const hour = new Date().getHours()
  let time = "Good evening"
  if (hour < 12) time = "Good morning"
  else if (hour < 18) time = "Good afternoon"

  return name ? `${time}, ${name}` : time
}
