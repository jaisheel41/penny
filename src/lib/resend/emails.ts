import { Resend } from "resend"

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendPlainEmail(to: string, subject: string, text: string) {
  const resend = getResend()
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skip email")
    return { skipped: true as const }
  }
  const from =
    process.env.RESEND_FROM ?? "Penny <onboarding@resend.dev>"
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    text,
  })
  if (error) throw new Error(error.message)
  return { id: data?.id, skipped: false as const }
}

export function weeklyDigestBody(params: {
  spent: string
  forecast: string
  topCategory: string
  budgetPct: string
}): string {
  return `Hi — here's your Penny week in review.

You've spent ${params.spent} so far this month.
Forecast for month-end: ${params.forecast}.
Biggest category: ${params.topCategory}.
Rough budget use: ${params.budgetPct}.

Stay on track — reply if you want to tweak alerts in Settings.`
}

export function budget80Body(params: {
  category: string
  spent: string
  limit: string
}): string {
  return `Heads up — you've used ${params.spent} of your ${params.limit} ${params.category} budget this month.`
}

export function overspendBody(params: { forecast: string; income: string }): string {
  return `Penny noticed your month-end forecast (${params.forecast}) is above your monthly income estimate (${params.income}). Worth a quick look at what's left this month.`
}

export function monthlyWrapBody(params: {
  month: string
  total: string
  topCategory: string
  vsPrev: string
}): string {
  return `${params.month} wrap-up

Total spend: ${params.total}
Top category: ${params.topCategory}
Vs previous month: ${params.vsPrev}

Here's to a clearer month ahead.`
}
