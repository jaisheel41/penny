import { addMonths, format, parse } from "date-fns"

import type { NetworthSnapshot } from "@/types"

import {
  avgMonthlyGrowthLast3,
  netWorthFromSnapshot,
  parseAmount,
  sortSnapshotsByMonthAsc,
} from "@/lib/networth/compute"
import {
  milestonesAtIndex,
  primaryMilestoneLabelForPoint,
} from "@/lib/networth/milestones"

const ROUND_TARGETS = [
  5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000,
]

export type ChartPoint = {
  monthKey: string
  shortLabel: string
  actual: number | null
  projected: number | null
  savings: number
  investments: number
  pension: number
  property_equity: number
  total_debt: number
  netWorth: number
  isProjection: boolean
  milestoneDot: boolean
  milestoneLabel: string | null
  note: string | null
}

export type ProjectionHit = {
  targetAmount: number
  months: number
  monthDate: Date
  monthLabel: string
}

export function nextRoundTarget(currentNw: number): number | null {
  for (const t of ROUND_TARGETS) {
    if (currentNw < t - 1e-6) return t
  }
  return null
}

export function projectionHitDate(
  sorted: NetworthSnapshot[],
  currentNw: number
): ProjectionHit | null {
  const growth = avgMonthlyGrowthLast3(sorted)
  if (growth <= 0) return null
  const target = nextRoundTarget(currentNw)
  if (target === null) return null
  const gap = target - currentNw
  if (gap <= 0) return null
  const months = Math.ceil(gap / growth)
  if (!Number.isFinite(months) || months > 600) return null

  const last = sorted[sorted.length - 1]
  const base = parse(`${last.month}-01`, "yyyy-MM-dd", new Date())
  const monthDate = addMonths(base, months)
  return {
    targetAmount: target,
    months,
    monthDate,
    monthLabel: format(monthDate, "MMMM yyyy"),
  }
}

export function buildChartSeries(sortedInput: NetworthSnapshot[]) {
  const sorted = sortSnapshotsByMonthAsc(sortedInput)
  if (sorted.length === 0) {
    return { points: [] as ChartPoint[], avgGrowth: 0 }
  }

  const avgGrowth = avgMonthlyGrowthLast3(sorted)
  const last = sorted[sorted.length - 1]
  const lastNw = netWorthFromSnapshot(last)
  const lastDate = parse(`${last.month}-01`, "yyyy-MM-dd", new Date())

  const points: ChartPoint[] = []

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i]
    const nw = netWorthFromSnapshot(s)
    const shortLabel = format(
      parse(`${s.month}-01`, "yyyy-MM-dd", new Date()),
      "MMM yy"
    )
    points.push({
      monthKey: s.month,
      shortLabel,
      actual: nw,
      projected: null,
      savings: parseAmount(s.savings),
      investments: parseAmount(s.investments),
      pension: parseAmount(s.pension),
      property_equity: parseAmount(s.property_equity),
      total_debt: parseAmount(s.total_debt),
      netWorth: nw,
      isProjection: false,
      milestoneDot: milestonesAtIndex(sorted, i).length > 0,
      milestoneLabel: primaryMilestoneLabelForPoint(sorted, i),
      note: s.note,
    })
  }

  const anchorIdx = points.length - 1
  if (anchorIdx >= 0) {
    points[anchorIdx] = {
      ...points[anchorIdx],
      projected: lastNw,
    }
  }

  for (let m = 1; m <= 6; m++) {
    const d = addMonths(lastDate, m)
    const key = format(d, "yyyy-MM")
    const shortLabel = format(d, "MMM yy")
    const projNw = lastNw + avgGrowth * m
    points.push({
      monthKey: key,
      shortLabel,
      actual: null,
      projected: projNw,
      savings: 0,
      investments: 0,
      pension: 0,
      property_equity: 0,
      total_debt: 0,
      netWorth: projNw,
      isProjection: true,
      milestoneDot: false,
      milestoneLabel: null,
      note: null,
    })
  }

  return { points, avgGrowth }
}
