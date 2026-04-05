export const SPEND_DNA_ORDER = [
  "food",
  "investments",
  "bills",
  "subscriptions",
  "travel",
  "other",
] as const

export type SpendDnaCategory = (typeof SPEND_DNA_ORDER)[number]

export const SPEND_DNA_COLORS: Record<SpendDnaCategory, string> = {
  food: "#7F77DD",
  investments: "#16A34A",
  bills: "#EF9F27",
  subscriptions: "#E24B4A",
  travel: "#378ADD",
  other: "#D4537E",
}

export const SPEND_DNA_LABELS: Record<SpendDnaCategory, string> = {
  food: "Food",
  investments: "Investments",
  bills: "Bills",
  subscriptions: "Subscriptions",
  travel: "Travel",
  other: "Other",
}

function emptySums(): Record<SpendDnaCategory, number> {
  return {
    food: 0,
    investments: 0,
    bills: 0,
    subscriptions: 0,
    travel: 0,
    other: 0,
  }
}

/** Map raw transaction category strings into the six Spend DNA buckets. */
export function mapTransactionCategoryToDna(raw: string): SpendDnaCategory {
  const c = raw.trim().toLowerCase()
  if (c === "food" || c === "groceries") return "food"
  if (c === "investments" || c === "investment") return "investments"
  if (
    c === "bills" ||
    c === "rent" ||
    c === "utilities" ||
    c === "utility"
  ) {
    return "bills"
  }
  if (c === "subscriptions" || c === "subscription") return "subscriptions"
  if (c === "travel") return "travel"
  return "other"
}

export function sumSpendDnaByCategory(
  rows: { amount: string; category: string }[]
): Record<SpendDnaCategory, number> {
  const sums = emptySums()
  for (const r of rows) {
    const bucket = mapTransactionCategoryToDna(r.category)
    sums[bucket] += Number.parseFloat(r.amount)
  }
  return sums
}

export function spendDnaPercentages(
  sums: Record<SpendDnaCategory, number>,
  totalSpend: number
): Record<SpendDnaCategory, number> {
  if (totalSpend <= 0) return emptySums()
  const pct = emptySums()
  for (const k of SPEND_DNA_ORDER) {
    pct[k] = (sums[k] / totalSpend) * 100
  }
  return pct
}

export function dominantSpendDnaCategory(
  pct: Record<SpendDnaCategory, number>
): SpendDnaCategory {
  let best: SpendDnaCategory = "food"
  let max = -1
  for (const k of SPEND_DNA_ORDER) {
    if (pct[k] > max) {
      max = pct[k]
      best = k
    }
  }
  return best
}

export function resolveSpendArchetype(
  pct: Record<SpendDnaCategory, number>
): string {
  const food = pct.food
  const inv = pct.investments
  const bills = pct.bills
  const travel = pct.travel
  const subs = pct.subscriptions

  if (food > 30 && inv > 20) return "The Calculated Foodie"

  type Match = { name: string; excess: number }
  const matches: Match[] = []
  if (food > 30) matches.push({ name: "The Foodie", excess: food - 30 })
  if (inv > 20) matches.push({ name: "The Investor", excess: inv - 20 })
  if (bills > 40) matches.push({ name: "The Homebody", excess: bills - 40 })
  if (travel > 20) matches.push({ name: "The Explorer", excess: travel - 20 })
  if (subs > 25)
    matches.push({ name: "The Subscriber", excess: subs - 25 })

  if (matches.length === 0) return "The Balanced One"
  matches.sort((a, b) => b.excess - a.excess)
  return matches[0].name
}
