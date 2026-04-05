import type { NetworthSnapshot } from "@/types"

import { netWorthFromSnapshot, parseAmount } from "@/lib/networth/compute"

export type NetworthMilestone = {
  id: string
  label: string
  monthKey: string
  monthLabel: string
}

const THRESHOLDS = [
  { id: "5k", value: 5000, label: "£5k net worth" },
  { id: "10k", value: 10000, label: "£10k net worth" },
  { id: "25k", value: 25000, label: "£25k net worth" },
  { id: "50k", value: 50000, label: "£50k net worth" },
] as const

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  if (!y || !m) return monthKey
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
  })
}

/** Milestones achieved at each snapshot index (chronological). */
export function milestonesAtIndex(
  sorted: NetworthSnapshot[],
  index: number
): Omit<NetworthMilestone, "monthLabel">[] {
  const row = sorted[index]
  const nw = netWorthFromSnapshot(row)
  const prevNw = index > 0 ? netWorthFromSnapshot(sorted[index - 1]) : null
  const debt = parseAmount(row.total_debt)
  const prevDebt =
    index > 0 ? parseAmount(sorted[index - 1].total_debt) : null

  const out: Omit<NetworthMilestone, "monthLabel">[] = []

  if (nw > 0 && (prevNw === null || prevNw <= 0)) {
    out.push({ id: "first-positive", label: "First positive net worth", monthKey: row.month })
  }

  for (const t of THRESHOLDS) {
    if (nw >= t.value && (prevNw === null || prevNw < t.value)) {
      out.push({ id: t.id, label: t.label, monthKey: row.month })
    }
  }

  if (debt <= 0 && prevDebt !== null && prevDebt > 0) {
    out.push({ id: "debt-free", label: "Debt-free month", monthKey: row.month })
  }

  return out
}

export function collectAllMilestones(sorted: NetworthSnapshot[]): NetworthMilestone[] {
  const seen = new Set<string>()
  const list: NetworthMilestone[] = []
  for (let i = 0; i < sorted.length; i++) {
    for (const m of milestonesAtIndex(sorted, i)) {
      const key = `${m.id}:${m.monthKey}`
      if (seen.has(key)) continue
      seen.add(key)
      list.push({ ...m, monthLabel: monthLabel(m.monthKey) })
    }
  }
  return list
}

export function primaryMilestoneLabelForPoint(
  sorted: NetworthSnapshot[],
  index: number
): string | null {
  const ms = milestonesAtIndex(sorted, index)
  if (ms.length === 0) return null
  const debtFree = ms.find((x) => x.id === "debt-free")
  if (debtFree) return "Debt-free"
  const big = ms.find((x) => x.id === "50k")
  if (big) return "£50k"
  const mid = ms.find((x) => x.id === "25k")
  if (mid) return "£25k"
  const sm = ms.find((x) => x.id === "10k")
  if (sm) return "£10k"
  const f5 = ms.find((x) => x.id === "5k")
  if (f5) return "£5k"
  const fp = ms.find((x) => x.id === "first-positive")
  if (fp) return "Positive"
  return null
}
