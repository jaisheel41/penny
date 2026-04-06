import Link from "next/link"
import { Suspense } from "react"

import { TransactionList } from "@/components/transactions/TransactionList"
import { BudgetsClient } from "@/components/budgets/BudgetsClient"
import { SubscriptionsClient } from "@/components/subscriptions/SubscriptionsClient"
import { ManageTabs } from "@/components/layout/ManageTabs"
import {
  currentMonthKey,
  monthBounds,
  sumByCategory,
} from "@/lib/dashboard/aggregates"
import { createClient } from "@/lib/supabase/server"
import { SPEND_CATEGORIES } from "@/types"

interface Props {
  searchParams: Promise<{ tab?: string; month?: string; category?: string }>
}

export default async function ManagePage({ searchParams }: Props) {
  const sp = await searchParams
  const tab = sp.tab ?? "transactions"
  const month =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : currentMonthKey()
  const category = sp.category ?? ""

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .maybeSingle()

  const currency =
    profile?.currency && profile.currency.length === 3
      ? profile.currency
      : "GBP"

  return (
    <div
      className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >
      {/* ── Page header card ──────────────────────────────────────── */}
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
              Transactions,
            </span>
            <span
              style={{
                display: "block",
                color: "#22c55e",
                WebkitTextFillColor: "#22c55e",
                WebkitTextStroke: "0px",
              }}
            >
              Manage.
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
            Transactions, budgets &amp; subscriptions — all in one place.
          </p>
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────── */}
      <Suspense fallback={<TabSkeleton />}>
        <ManageTabs>
          {tab === "transactions" && (
            <TransactionsTab
              userId={user.id}
              month={month}
              category={category}
              currency={currency}
            />
          )}
          {tab === "budgets" && (
            <BudgetsTab userId={user.id} month={month} currency={currency} />
          )}
          {tab === "subscriptions" && (
            <SubscriptionsTab userId={user.id} currency={currency} />
          )}
        </ManageTabs>
      </Suspense>
    </div>
  )
}

async function TransactionsTab({
  userId,
  month,
  category,
  currency,
}: {
  userId: string
  month: string
  category: string
  currency: string
}) {
  const supabase = await createClient()
  const { start, end } = monthBounds(month)

  let q = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  if (
    category &&
    SPEND_CATEGORIES.includes(category as (typeof SPEND_CATEGORIES)[number])
  ) {
    q = q.eq("category", category)
  }

  const { data: transactions } = await q
  const base = "/manage?tab=transactions"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Category filter chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
        <FilterChip
          href={`${base}&month=${month}`}
          active={!category}
          label="All"
        />
        {SPEND_CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            href={`${base}&month=${month}&category=${c}`}
            active={category === c}
            label={c}
          />
        ))}
      </div>
      <TransactionList
        key={`${month}-${category || "all"}`}
        initial={transactions ?? []}
        month={month}
        category={category}
        currency={currency}
      />
    </div>
  )
}

async function BudgetsTab({
  userId,
  month,
  currency,
}: {
  userId: string
  month: string
  currency: string
}) {
  const supabase = await createClient()
  const { start, end } = monthBounds(month)

  const { data: txRows } = await supabase
    .from("transactions")
    .select("amount, category")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)

  const spentBy = sumByCategory(txRows ?? [])

  const { data: budgets } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)

  return (
    <BudgetsClient
      currency={currency}
      month={month}
      initialBudgets={budgets ?? []}
      spentByCategory={spentBy}
    />
  )
}

async function SubscriptionsTab({
  userId,
  currency,
}: {
  userId: string
  currency: string
}) {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("name")

  return <SubscriptionsClient currency={currency} initial={subs ?? []} />
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.3125rem 0.875rem",
        borderRadius: "9999px",
        fontSize: "0.78rem",
        fontWeight: active ? 600 : 400,
        textTransform: "capitalize",
        textDecoration: "none",
        border: active
          ? "1px solid rgba(34,197,94,0.35)"
          : "1px solid rgba(255,255,255,0.09)",
        background: active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
        color: active ? "#22c55e" : "rgba(240,239,233,0.48)",
        transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {label}
    </Link>
  )
}

function TabSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "0.875rem",
          padding: "0.3rem",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "2.5rem",
              borderRadius: "0.625rem",
              background: "rgba(255,255,255,0.06)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
      <div
        style={{
          height: "16rem",
          borderRadius: "0.875rem",
          background: "rgba(255,255,255,0.04)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
