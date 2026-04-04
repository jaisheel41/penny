import { NextResponse } from "next/server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import {
  sendPlainEmail,
  weeklyDigestBody,
} from "@/lib/resend/emails"
import { currentMonthKey, monthBounds, sumByCategory } from "@/lib/dashboard/aggregates"
import { projectMonthEndSpend } from "@/lib/utils/forecast"
import { formatMoney } from "@/lib/utils/parser"
function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const week = isoWeekKey(new Date())
  const month = currentMonthKey()
  const { start, end } = monthBounds(month)

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, currency, email_notifications")
    .eq("email_notifications", true)

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  let sent = 0
  for (const profile of profiles ?? []) {
    const { data: digestLogs } = await supabase
      .from("notification_log")
      .select("id, payload")
      .eq("user_id", profile.id)
      .eq("type", "weekly_digest")

    const already = (digestLogs ?? []).some(
      (r) => (r.payload as { week?: string } | null)?.week === week
    )
    if (already) continue

    const { data: authData, error: authErr } =
      await supabase.auth.admin.getUserById(profile.id)
    if (authErr || !authData.user?.email) continue

    const email = authData.user.email
    const currency =
      profile.currency && profile.currency.length === 3 ? profile.currency : "GBP"

    const { data: txRows } = await supabase
      .from("transactions")
      .select("amount, category")
      .eq("user_id", profile.id)
      .gte("date", start)
      .lte("date", end)

    const rows = txRows ?? []
    let monthTotal = 0
    for (const r of rows) monthTotal += Number.parseFloat(r.amount)
    const byCat = sumByCategory(rows)

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("amount")
      .eq("user_id", profile.id)
      .eq("active", true)

    const subTotal = (subs ?? []).reduce(
      (s, r) => s + Number.parseFloat(r.amount),
      0
    )

    const { projectedTotal } = projectMonthEndSpend({
      monthToDateSpend: monthTotal,
      referenceDate: new Date(),
      subscriptionMonthlyTotal: subTotal,
    })

    let topCategory = "—"
    let top = 0
    for (const [k, v] of Object.entries(byCat)) {
      if ((v ?? 0) > top) {
        top = v ?? 0
        topCategory = k
      }
    }

    const { data: budgets } = await supabase
      .from("budgets")
      .select("monthly_limit")
      .eq("user_id", profile.id)
      .eq("month", month)

    const budgetSum = (budgets ?? []).reduce(
      (s, b) => s + Number.parseFloat(b.monthly_limit),
      0
    )
    const budgetPct =
      budgetSum > 0
        ? `${Math.min(100, Math.round((monthTotal / budgetSum) * 100))}%`
        : "n/a"

    const text = weeklyDigestBody({
      spent: formatMoney(monthTotal, currency),
      forecast: formatMoney(projectedTotal, currency),
      topCategory,
      budgetPct,
    })

    try {
      await sendPlainEmail(email, "Penny — your weekly digest", text)
      await supabase.from("notification_log").insert({
        user_id: profile.id,
        type: "weekly_digest",
        payload: { week },
      })
      sent++
    } catch (e) {
      console.error(e)
    }
  }

  return NextResponse.json({ ok: true, sent, week })
}
