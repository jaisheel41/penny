import { format, subMonths } from "date-fns"
import { NextResponse } from "next/server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import { monthlyWrapBody, sendPlainEmail } from "@/lib/resend/emails"
import { monthBounds, sumByCategory } from "@/lib/dashboard/aggregates"
import { formatMoney } from "@/lib/utils/parser"

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

/** Previous calendar month as YYYY-MM */
function previousMonthKey(d = new Date()): string {
  return format(subMonths(d, 1), "yyyy-MM")
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const wrappedMonth = previousMonthKey()
  const { start, end } = monthBounds(wrappedMonth)

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, currency, email_notifications")
    .eq("email_notifications", true)

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  const prevPrev = format(subMonths(new Date(wrappedMonth + "-01"), 1), "yyyy-MM")
  const prevBounds = monthBounds(prevPrev)

  let sent = 0
  for (const profile of profiles ?? []) {
    const { data: logs } = await supabase
      .from("notification_log")
      .select("id, payload")
      .eq("user_id", profile.id)
      .eq("type", "monthly_wrapup")

    const already = (logs ?? []).some(
      (r) => (r.payload as { month?: string } | null)?.month === wrappedMonth
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
    let total = 0
    for (const r of rows) total += Number.parseFloat(r.amount)
    const byCat = sumByCategory(rows)

    let topCategory = "—"
    let top = 0
    for (const [k, v] of Object.entries(byCat)) {
      if ((v ?? 0) > top) {
        top = v ?? 0
        topCategory = k
      }
    }

    const { data: prevRows } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", profile.id)
      .gte("date", prevBounds.start)
      .lte("date", prevBounds.end)

    let prevTotal = 0
    for (const r of prevRows ?? []) prevTotal += Number.parseFloat(r.amount)
    const vsPrev =
      prevTotal > 0
        ? `${(((total - prevTotal) / prevTotal) * 100).toFixed(0)}%`
        : total > 0
          ? "new activity"
          : "flat"

    const text = monthlyWrapBody({
      month: wrappedMonth,
      total: formatMoney(total, currency),
      topCategory,
      vsPrev,
    })

    try {
      await sendPlainEmail(
        email,
        `Penny — ${wrappedMonth} wrap-up`,
        text
      )
      await supabase.from("notification_log").insert({
        user_id: profile.id,
        type: "monthly_wrapup",
        payload: { month: wrappedMonth },
      })
      sent++
    } catch (e) {
      console.error(e)
    }
  }

  return NextResponse.json({ ok: true, sent, month: wrappedMonth })
}
