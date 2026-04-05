import type { SupabaseClient } from "@supabase/supabase-js"

import { projectMonthEndSpend } from "@/lib/utils/forecast"
import { formatMoney } from "@/lib/utils/parser"
import {
  budget80Body,
  overspendBody,
  sendPlainEmail,
} from "@/lib/resend/emails"
import type { Database } from "@/lib/supabase/types"
import type { SpendCategory } from "@/types"

type Supabase = SupabaseClient<Database>

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export async function runPostTransactionNotifications(
  supabase: Supabase,
  userId: string,
  userEmail: string | undefined,
  opts: { insertedCategory: SpendCategory; referenceDate: Date }
) {
  if (!userEmail || !process.env.RESEND_API_KEY) return

  const { data: profile } = await supabase
    .from("profiles")
    .select("monthly_income, currency, email_notifications")
    .eq("id", userId)
    .single()

  if (profile?.email_notifications === false) return

  const currency = profile?.currency?.length === 3 ? profile.currency : "GBP"
  const income = profile?.monthly_income
    ? Number.parseFloat(profile.monthly_income)
    : 0

  const ref = opts.referenceDate
  const month = monthKey(ref)
  const start = `${month}-01`
  const endDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
  const end = `${month}-${String(endDate.getDate()).padStart(2, "0")}`

  const { data: txRows } = await supabase
    .from("transactions")
    .select("amount, category")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)

  let monthTotal = 0
  const byCat: Partial<Record<SpendCategory, number>> = {}
  for (const row of txRows ?? []) {
    const a = Number.parseFloat(row.amount)
    monthTotal += a
    const c = row.category as SpendCategory
    byCat[c] = (byCat[c] ?? 0) + a
  }

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("amount")
    .eq("user_id", userId)
    .eq("active", true)

  const subTotal = (subs ?? []).reduce(
    (s, r) => s + Number.parseFloat(r.amount),
    0
  )

  const { projectedTotal } = projectMonthEndSpend({
    monthToDateSpend: monthTotal,
    referenceDate: ref,
    subscriptionMonthlyTotal: subTotal,
    oneOffCosts: byCat.rent ?? 0,
  })

  if (income > 0 && projectedTotal > income) {
    const { data: overspendLogs } = await supabase
      .from("notification_log")
      .select("id, payload")
      .eq("user_id", userId)
      .eq("type", "overspend")

    const alreadySent = (overspendLogs ?? []).some(
      (r) => (r.payload as { month?: string } | null)?.month === month
    )

    if (!alreadySent) {
      await sendPlainEmail(
        userEmail,
        "Penny — spending outlook",
        overspendBody({
          forecast: formatMoney(projectedTotal, currency),
          income: formatMoney(income, currency),
        })
      )
      await supabase.from("notification_log").insert({
        user_id: userId,
        type: "overspend",
        payload: { month },
      })
    }
  }

  const { data: budgetRow } = await supabase
    .from("budgets")
    .select("id, monthly_limit")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("category", opts.insertedCategory)
    .maybeSingle()

  if (budgetRow) {
    const limit = Number.parseFloat(budgetRow.monthly_limit)
    const spent = byCat[opts.insertedCategory] ?? 0
    if (limit > 0 && spent / limit >= 0.8) {
      const { data: budgetLogs } = await supabase
        .from("notification_log")
        .select("id, payload")
        .eq("user_id", userId)
        .eq("type", "budget_80")

      const dup = (budgetLogs ?? []).some((r) => {
        const p = r.payload as { month?: string; category?: string } | null
        return p?.month === month && p?.category === opts.insertedCategory
      })

      if (!dup) {
        await sendPlainEmail(
          userEmail,
          `Penny — ${opts.insertedCategory} budget`,
          budget80Body({
            category: opts.insertedCategory,
            spent: formatMoney(spent, currency),
            limit: formatMoney(limit, currency),
          })
        )
        await supabase.from("notification_log").insert({
          user_id: userId,
          type: "budget_80",
          payload: { month, category: opts.insertedCategory },
        })
      }
    }
  }
}
