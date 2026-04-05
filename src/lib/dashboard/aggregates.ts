import { format } from "date-fns"

import type { SpendCategory } from "@/types"

export function currentMonthKey(d = new Date()): string {
  return format(d, "yyyy-MM")
}

export function monthBounds(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number)
  const end = new Date(y, m, 0)
  return {
    start: `${month}-01`,
    end: `${month}-${String(end.getDate()).padStart(2, "0")}`,
  }
}

export function sumByCategory(
  rows: { amount: string; category: string }[]
): Partial<Record<SpendCategory, number>> {
  const by: Partial<Record<SpendCategory, number>> = {}
  for (const r of rows) {
    const c = r.category as SpendCategory
    const a = Number.parseFloat(r.amount)
    by[c] = (by[c] ?? 0) + a
  }
  return by
}

/** Rough % change: last 7d food vs previous 7d food */
export function foodWeekOverWeekDeltaPct(
  rows: { amount: string; category: string; date: string }[],
  ref: Date
): number | undefined {
  const ms = 86400000
  const t0 = ref.getTime()
  const food = (from: number, to: number) => {
    let s = 0
    for (const r of rows) {
      if (r.category !== "food" && r.category !== "groceries") continue
      const dt = new Date(r.date + "T12:00:00").getTime()
      if (dt >= from && dt < to) s += Number.parseFloat(r.amount)
    }
    return s
  }
  const last = food(t0 - 7 * ms, t0 + ms)
  const prev = food(t0 - 14 * ms, t0 - 7 * ms)
  if (prev <= 0 && last <= 0) return undefined
  if (prev <= 0) return 100
  return ((last - prev) / prev) * 100
}
