import type { NetworthSnapshot } from "@/types"

export function parseAmount(s: string | number | null | undefined): number {
  if (s == null) return 0
  const n = typeof s === "number" ? s : Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

export function netWorthFromSnapshot(row: NetworthSnapshot): number {
  const savings = parseAmount(row.savings)
  const investments = parseAmount(row.investments)
  const pension = parseAmount(row.pension)
  const property_equity = parseAmount(row.property_equity)
  const total_debt = parseAmount(row.total_debt)
  return savings + investments + pension + property_equity - total_debt
}

export function sortSnapshotsByMonthAsc(rows: NetworthSnapshot[]): NetworthSnapshot[] {
  return [...rows].sort((a, b) => a.month.localeCompare(b.month))
}

/** Mean of up to the last 3 month-over-month net-worth deltas (most recent first). */
export function avgMonthlyGrowthLast3(sorted: NetworthSnapshot[]): number {
  if (sorted.length < 2) return 0
  const nws = sorted.map(netWorthFromSnapshot)
  const deltas: number[] = []
  for (let i = sorted.length - 1; i > 0 && deltas.length < 3; i--) {
    deltas.push(nws[i] - nws[i - 1])
  }
  if (deltas.length === 0) return 0
  return deltas.reduce((a, b) => a + b, 0) / deltas.length
}

/** Month-on-month delta; null if fewer than two snapshots. */
export function changeVsPrevious(
  sorted: NetworthSnapshot[],
  pick: (row: NetworthSnapshot) => number
): { current: number; delta: number } | null {
  if (sorted.length < 2) return null
  const last = sorted[sorted.length - 1]
  const prevRow = sorted[sorted.length - 2]
  const cur = pick(last)
  const prev = pick(prevRow)
  return { current: cur, delta: cur - prev }
}
