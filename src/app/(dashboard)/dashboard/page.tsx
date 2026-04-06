import { format } from "date-fns"

import { DashboardContent } from "@/components/dashboard/DashboardContent"
import {
  currentMonthKey,
  foodWeekOverWeekDeltaPct,
  monthBounds,
  sumByCategory,
} from "@/lib/dashboard/aggregates"
import { buildMonthlyPulse } from "@/lib/utils/monthly-pulse"
import { projectMonthEndSpend } from "@/lib/utils/forecast"
import { createClient } from "@/lib/supabase/server"
import type { SpendCategory } from "@/types"

function getGreeting(name?: string): string {
  const hour = new Date().getHours()
  let time = "Good evening"
  if (hour < 12) time = "Good morning"
  else if (hour < 18) time = "Good afternoon"
  return name ? `${time}, ${name.split(" ")[0]}` : time
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
    profile?.currency && profile.currency.length === 3
      ? profile.currency
      : "GBP"
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
  for (const r of rows) monthTotal += Number.parseFloat(r.amount)

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
    // Rent is a one-off monthly cost — exclude from the daily rate so it
    // isn't projected forward as if it recurs every day.
    oneOffCosts: byCategory.rent ?? 0,
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

  return (
    <DashboardContent
      data={{
        greeting: getGreeting(profile?.name ?? undefined),
        displayDate: format(new Date(), "EEEE, d MMMM yyyy"),
        currency,
        monthlyIncome,
        displayMonth: format(new Date(month + "-01"), "MMMM yyyy"),
        monthTotal,
        txCount: rows.length,
        subCount: (subs ?? []).length,
        subTotal,
        projectedTotal,
        dailyRate,
        daysRemaining,
        pulseText,
        dayOfMonth: ref.getDate(),
        totalDaysInMonth: new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate(),
        byCategory,
      }}
    />
  )
}
