import { formatMoney } from "@/lib/utils/parser"
import type { SpendCategory } from "@/types"

export interface PulseInput {
  currencyCode: string
  totalSpent: number
  /** category -> amount this month */
  byCategory: Partial<Record<SpendCategory, number>>
  /** optional: last week vs previous week delta by category (ratio) */
  categoryDeltaPct?: Partial<Record<SpendCategory, number>>
  /** categories with zero spend for 3+ weeks — simplified: pass names */
  quietCategories?: string[]
}

export function buildMonthlyPulse(input: PulseInput): string {
  const { currencyCode, totalSpent, byCategory, categoryDeltaPct, quietCategories } =
    input
  const totalStr = formatMoney(totalSpent, currencyCode)

  const parts: string[] = [`You've spent ${totalStr} so far this month.`]

  const food = byCategory.food ?? 0
  const foodDelta = categoryDeltaPct?.food
  if (food > 0 && foodDelta !== undefined && Math.abs(foodDelta) >= 5) {
    const dir = foodDelta > 0 ? "up" : "down"
    parts.push(`Food delivery and groceries are ${dir} about ${Math.round(Math.abs(foodDelta))}% vs last week.`)
  }

  const top = Object.entries(byCategory)
    .filter(([, v]) => (v ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]
  if (top) {
    const label = formatCategoryLabel(top[0] as SpendCategory)
    parts.push(`Your biggest category is ${label}.`)
  }

  if (quietCategories?.length) {
    parts.push(
      `You haven't spent on ${quietCategories.slice(0, 2).join(" or ")} recently.`
    )
  }

  return parts.join(" ")
}

function formatCategoryLabel(c: SpendCategory): string {
  const map: Record<SpendCategory, string> = {
    rent: "rent",
    food: "food",
    travel: "travel",
    subscriptions: "subscriptions",
    clothes: "clothes",
    entertainment: "entertainment",
    misc: "everything else",
  }
  return map[c] ?? c
}
