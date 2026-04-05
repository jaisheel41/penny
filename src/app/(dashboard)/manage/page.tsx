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
import { cn } from "@/lib/utils"

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
    <div className="mx-auto max-w-[1200px] px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="heading-tight text-2xl text-foreground sm:text-[24px]">
          Manage
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-[14px]">
          Transactions, budgets &amp; subscriptions — all in one place.
        </p>
      </div>

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
    <div className="space-y-4">
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
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
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition-all duration-150",
        active
          ? "border-penny-green bg-penny-green-muted text-penny-green shadow-elevation-sm"
          : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
      )}
    >
      {label}
    </Link>
  )
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 rounded-2xl border border-border bg-muted p-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 flex-1 animate-pulse rounded-xl bg-border"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}
