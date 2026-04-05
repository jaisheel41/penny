export function goalAmounts(g: {
  target_amount: string
  saved_amount: string
  monthly_contribution: string
}) {
  const target = Number.parseFloat(g.target_amount)
  const saved = Number.parseFloat(g.saved_amount)
  const monthly = Number.parseFloat(g.monthly_contribution)
  return { target, saved, monthly }
}

export function progressPercent(target: number, saved: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0
  return Math.min(100, Math.max(0, (saved / target) * 100))
}

/** Months to reach target at given monthly rate; null if rate invalid. */
export function monthsAway(
  target: number,
  saved: number,
  monthlyContribution: number
): number | null {
  if (!Number.isFinite(monthlyContribution) || monthlyContribution <= 0) {
    return null
  }
  const remaining = Math.max(0, target - saved)
  if (remaining <= 0) return 0
  return Math.ceil(remaining / monthlyContribution)
}

export function highestMilestonePct(progressPct: number): 0 | 25 | 50 | 75 | 100 {
  if (progressPct >= 100) return 100
  if (progressPct >= 75) return 75
  if (progressPct >= 50) return 50
  if (progressPct >= 25) return 25
  return 0
}

const STORAGE_KEY = "penny-goal-milestones-v1"

export function readMilestoneState(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const o = JSON.parse(raw) as unknown
    return typeof o === "object" && o !== null && !Array.isArray(o)
      ? (o as Record<string, number>)
      : {}
  } catch {
    return {}
  }
}

export function writeMilestoneState(state: Record<string, number>) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Sync storage to current progress so reloads don’t re-trigger celebrations. */
export function hydrateMilestoneState(
  goals: { id: string; target_amount: string; saved_amount: string }[]
) {
  const state = readMilestoneState()
  let changed = false
  for (const g of goals) {
    const target = Number.parseFloat(g.target_amount)
    const saved = Number.parseFloat(g.saved_amount)
    const pct = progressPercent(target, saved)
    const h = highestMilestonePct(pct)
    const cur = state[g.id] ?? 0
    const next = Math.max(cur, h)
    if (next !== cur) {
      state[g.id] = next
      changed = true
    }
  }
  if (changed) writeMilestoneState(state)
}

export function milestoneToastMessage(goalName: string, milestone: 25 | 50 | 75 | 100): string {
  if (milestone === 100) return `🎉 You reached ${goalName}!`
  if (milestone === 75) return `🎉 You're three-quarters of the way to ${goalName}!`
  if (milestone === 50) return `🎉 You're halfway to ${goalName}!`
  return `🎉 You're a quarter of the way to ${goalName}!`
}

export function celebrateMilestone(milestone: 25 | 50 | 75 | 100) {
  const burst =
    milestone === 100
      ? { particleCount: 160, spread: 100 }
      : { particleCount: 100, spread: 80 }
  void import("canvas-confetti").then((mod) => {
    const confetti = mod.default
    confetti({
      ...burst,
      origin: { x: 0.5, y: 0.35 },
    })
    if (milestone >= 50) {
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 60, origin: { x: 0.3, y: 0.6 } })
      }, 200)
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 60, origin: { x: 0.7, y: 0.6 } })
      }, 350)
    }
  })
}
