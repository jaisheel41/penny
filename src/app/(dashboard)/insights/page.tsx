import { redirect } from "next/navigation"
import { format, subMonths } from "date-fns"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { monthBounds, sumByCategory } from "@/lib/dashboard/aggregates"
import {
  resolveSpendArchetype,
  spendDnaPercentages,
  sumSpendDnaByCategory,
  type SpendDnaCategory,
} from "@/lib/insights/spend-dna"
import { formatMoney } from "@/lib/utils/parser"
import { cn } from "@/lib/utils"
import { CategoryBars } from "@/components/dashboard/CategoryBars"
import {
  SpendDNA,
  type SpendDnaMonthSlice,
} from "@/components/insights/SpendDNA"
import type { SpendCategory } from "@/types"

interface MonthSummary {
  key: string
  label: string
  total: number
  byCategory: Partial<Record<SpendCategory, number>>
  txCount: number
  dnaPct: Record<SpendDnaCategory, number>
}

export default async function InsightsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .maybeSingle()

  const currency = profile?.currency ?? "GBP"

  // Fetch last 4 months of data
  const months: MonthSummary[] = []
  for (let i = 0; i < 4; i++) {
    const d = subMonths(new Date(), i)
    const key = format(d, "yyyy-MM")
    const label = format(d, i === 0 ? "'This month'" : "MMMM")
    const { start, end } = monthBounds(key)

    const { data: rows } = await supabase
      .from("transactions")
      .select("amount, category, merchant")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)

    const rowList = rows ?? []
    let total = 0
    for (const r of rowList) total += Number.parseFloat(r.amount)

    const dnaSums = sumSpendDnaByCategory(rowList)
    const dnaPct = spendDnaPercentages(dnaSums, total)

    months.push({
      key,
      label,
      total,
      byCategory: sumByCategory(rowList),
      txCount: rowList.length,
      dnaPct,
    })
  }

  // Top merchants (current month)
  const { data: allTx } = await supabase
    .from("transactions")
    .select("merchant, amount")
    .eq("user_id", user.id)
    .gte("date", monthBounds(months[0].key).start)
    .lte("date", monthBounds(months[0].key).end)

  const merchantMap: Record<string, number> = {}
  for (const r of allTx ?? []) {
    const m = r.merchant ?? "Unknown"
    merchantMap[m] = (merchantMap[m] ?? 0) + Number.parseFloat(r.amount)
  }
  const topMerchants = Object.entries(merchantMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const thisMonth = months[0]
  const lastMonth = months[1]
  const momDelta =
    lastMonth.total > 0
      ? ((thisMonth.total - lastMonth.total) / lastMonth.total) * 100
      : 0
  const maxMonthTotal = Math.max(...months.map((m) => m.total), 1)

  const spendArchetype = resolveSpendArchetype(months[0].dnaPct)
  const spendDnaEvolution: [
    SpendDnaMonthSlice,
    SpendDnaMonthSlice,
    SpendDnaMonthSlice,
  ] = [
    {
      key: months[2].key,
      label: months[2].label,
      percentages: { ...months[2].dnaPct },
    },
    {
      key: months[1].key,
      label: months[1].label,
      percentages: { ...months[1].dnaPct },
    },
    {
      key: months[0].key,
      label: months[0].label,
      percentages: { ...months[0].dnaPct },
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-tight text-2xl text-foreground sm:text-[24px]">
          Insights
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-[14px]">
          Spending patterns, trends, and your top categories.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm">
            <p className="label-caps text-muted-foreground">This month</p>
            <p
              className="number-display mt-2 text-[32px] text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              {formatMoney(thisMonth.total, currency)}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">{thisMonth.label}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm">
            <p className="label-caps text-muted-foreground">Last month</p>
            <p
              className="number-display mt-2 text-[32px] text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              {formatMoney(lastMonth.total, currency)}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">{lastMonth.label}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm">
            <p className="label-caps text-muted-foreground">Vs last month</p>
            <div className="mt-2 flex items-center gap-2">
              {momDelta > 5 ? (
                <TrendingUp className="size-6 text-destructive" aria-hidden />
              ) : momDelta < -5 ? (
                <TrendingDown className="size-6 text-penny-green" aria-hidden />
              ) : (
                <Minus className="size-6 text-muted-foreground" aria-hidden />
              )}
              <p
                className={cn(
                  "number-display text-[32px]",
                  momDelta > 5 && "text-destructive",
                  momDelta < -5 && "text-penny-green",
                  momDelta >= -5 && momDelta <= 5 && "text-muted-foreground"
                )}
                style={{ letterSpacing: "-0.02em" }}
              >
                {momDelta >= 0 ? "+" : ""}
                {momDelta.toFixed(0)}%
              </p>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {momDelta > 0 ? "More than last month" : momDelta < 0 ? "Less than last month" : "Same as last month"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm">
          <h2 className="mb-5 text-[16px] font-semibold tracking-tight text-foreground">
            Monthly spending
          </h2>
          <div className="flex h-36 items-end gap-3">
            {[...months].reverse().map((m) => {
              const pct = maxMonthTotal > 0 ? (m.total / maxMonthTotal) * 100 : 0
              const isThisMonth = m.key === months[0].key
              return (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                  <p className="text-[12px] tabular-nums text-muted-foreground">
                    {formatMoney(m.total, currency)}
                  </p>
                  <div
                    className={cn(
                      "w-full rounded-t-lg",
                      isThisMonth ? "bg-penny-green" : "bg-muted"
                    )}
                    style={{
                      height: `${Math.max(pct, 4)}%`,
                      maxHeight: "100%",
                      minHeight: 8,
                    }}
                  />
                  <p className="text-[11px] font-medium text-muted-foreground">{m.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        <SpendDNA
          archetype={spendArchetype}
          txCountThisMonth={months[0].txCount}
          currentPercentages={months[0].dnaPct}
          evolution={spendDnaEvolution}
        />

        {/* Category breakdown + top merchants */}
        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryBars
            currency={currency}
            byCategory={thisMonth.byCategory}
            totalSpent={thisMonth.total}
          />

          {/* Top merchants */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-elevation-md">
            <h2 className="mb-5 text-[16px] font-semibold tracking-tight text-foreground">
              Top merchants
            </h2>
            {topMerchants.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-muted-foreground">
                No transactions this month yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {topMerchants.map(([merchant, amount], idx) => {
                  const pct = thisMonth.total > 0 ? (amount / thisMonth.total) * 100 : 0
                  return (
                    <li key={merchant}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                            {idx + 1}
                          </span>
                          <span className="text-[14px] font-medium capitalize text-foreground">
                            {merchant}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[12px] text-muted-foreground">{pct.toFixed(0)}%</span>
                          <span className="text-[14px] font-semibold tabular-nums text-foreground">
                            {formatMoney(amount, currency)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-penny-green"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
