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
import {
  SpendDNA,
  type SpendDnaMonthSlice,
} from "@/components/insights/SpendDNA"
import { InsightsBarChart } from "@/components/insights/InsightsBarChart"
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

  // ── Fetch last 4 months ────────────────────────────────────────────────
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
    { key: months[2].key, label: months[2].label, percentages: { ...months[2].dnaPct } },
    { key: months[1].key, label: months[1].label, percentages: { ...months[1].dnaPct } },
    { key: months[0].key, label: months[0].label, percentages: { ...months[0].dnaPct } },
  ]

  const barData = [...months].reverse().map((m) => ({
    key: m.key,
    label: m.label,
    total: m.total,
    pct: maxMonthTotal > 0 ? (m.total / maxMonthTotal) * 100 : 0,
    isCurrent: m.key === thisMonth.key,
  }))

  return (
    <div
      className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >
      {/* ── Outlined header card ──────────────────────────────────── */}
      <div
        style={{
          background: "#111110",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1.25rem",
          padding: "clamp(1.5rem, 4vw, 2rem)",
          marginBottom: "1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grain */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            opacity: 0.45,
          }}
        />
        {/* Glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-50%",
            left: "-10%",
            width: "50%",
            height: "200%",
            background:
              "radial-gradient(ellipse at center, rgba(34,197,94,0.09) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              lineHeight: 0.9,
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                display: "block",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                WebkitTextStroke: "1.5px rgba(240,239,233,0.45)",
              }}
            >
              Spending
            </span>
            <span
              style={{
                display: "block",
                color: "#22c55e",
                WebkitTextFillColor: "#22c55e",
                WebkitTextStroke: "0px",
              }}
            >
              Insights.
            </span>
          </h1>
          <p
            style={{
              marginTop: "0.875rem",
              fontSize: "0.875rem",
              color: "rgba(240,239,233,0.38)",
              lineHeight: 1.55,
            }}
          >
            Spending patterns, trends, and your monthly DNA.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ── 3 stat cards ──────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">

          {/* This month */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "1rem",
              padding: "1.375rem",
            }}
          >
            <p
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(240,239,233,0.35)",
                marginBottom: "0.5rem",
              }}
            >
              This month
            </p>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "#f0efe9",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatMoney(thisMonth.total, currency)}
            </p>
            <p
              style={{
                marginTop: "0.375rem",
                fontSize: "0.8rem",
                color: "rgba(240,239,233,0.3)",
              }}
            >
              {thisMonth.txCount} transaction{thisMonth.txCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Last month */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "1rem",
              padding: "1.375rem",
            }}
          >
            <p
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(240,239,233,0.35)",
                marginBottom: "0.5rem",
              }}
            >
              Last month
            </p>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "#f0efe9",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatMoney(lastMonth.total, currency)}
            </p>
            <p
              style={{
                marginTop: "0.375rem",
                fontSize: "0.8rem",
                color: "rgba(240,239,233,0.3)",
              }}
            >
              {lastMonth.label}
            </p>
          </div>

          {/* MoM delta */}
          <div
            style={{
              background:
                momDelta > 5
                  ? "rgba(248,113,113,0.05)"
                  : momDelta < -5
                    ? "rgba(34,197,94,0.05)"
                    : "rgba(255,255,255,0.04)",
              border:
                momDelta > 5
                  ? "1px solid rgba(248,113,113,0.18)"
                  : momDelta < -5
                    ? "1px solid rgba(34,197,94,0.18)"
                    : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "1rem",
              padding: "1.375rem",
            }}
          >
            <p
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(240,239,233,0.35)",
                marginBottom: "0.5rem",
              }}
            >
              Vs last month
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {momDelta > 5 ? (
                <TrendingUp
                  style={{ width: "1.375rem", height: "1.375rem", color: "#f87171", flexShrink: 0 }}
                />
              ) : momDelta < -5 ? (
                <TrendingDown
                  style={{ width: "1.375rem", height: "1.375rem", color: "#22c55e", flexShrink: 0 }}
                />
              ) : (
                <Minus
                  style={{
                    width: "1.375rem",
                    height: "1.375rem",
                    color: "rgba(240,239,233,0.4)",
                    flexShrink: 0,
                  }}
                />
              )}
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  color:
                    momDelta > 5
                      ? "#f87171"
                      : momDelta < -5
                        ? "#22c55e"
                        : "rgba(240,239,233,0.45)",
                }}
              >
                {momDelta >= 0 ? "+" : ""}
                {momDelta.toFixed(0)}%
              </p>
            </div>
            <p
              style={{
                marginTop: "0.375rem",
                fontSize: "0.8rem",
                color: "rgba(240,239,233,0.3)",
              }}
            >
              {momDelta > 0
                ? "More than last month"
                : momDelta < 0
                  ? "Less than last month"
                  : "Same as last month"}
            </p>
          </div>
        </div>

        {/* ── Animated bar chart ────────────────────────────────────── */}
        <InsightsBarChart currency={currency} bars={barData} />

        {/* ── Spend DNA ─────────────────────────────────────────────── */}
        <SpendDNA
          archetype={spendArchetype}
          txCountThisMonth={months[0].txCount}
          currentPercentages={months[0].dnaPct}
          evolution={spendDnaEvolution}
        />

      </div>
    </div>
  )
}
