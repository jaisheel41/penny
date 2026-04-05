/**
 * Project total spend by end of month using average daily burn so far.
 *
 * `subscriptionMonthlyTotal` — recurring fixed costs tracked in the subscriptions
 *   table (not yet reflected in transactions). Added to the projection.
 *
 * `oneOffCosts` — large one-time monthly payments already in monthToDateSpend
 *   (e.g. rent, annual fees) that must NOT be extrapolated as daily recurring
 *   spend. They're already counted via monthToDateSpend so are stripped before
 *   computing the daily rate, then added back in the projection unchanged.
 */
export function projectMonthEndSpend(params: {
  monthToDateSpend: number
  referenceDate: Date
  subscriptionMonthlyTotal?: number
  oneOffCosts?: number
}): {
  projectedTotal: number
  dailyRate: number
  daysElapsed: number
  daysRemaining: number
} {
  const {
    monthToDateSpend,
    referenceDate,
    subscriptionMonthlyTotal = 0,
    oneOffCosts = 0,
  } = params

  const y = referenceDate.getFullYear()
  const m = referenceDate.getMonth()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const dayOfMonth = referenceDate.getDate()

  const daysElapsed = Math.max(1, dayOfMonth)
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth)

  // Strip one-off costs (e.g. rent) from the variable spend so they don't
  // inflate the daily rate and get projected forward 25 more times.
  const variableSpend = Math.max(
    0,
    monthToDateSpend - oneOffCosts - subscriptionMonthlyTotal
  )
  const dailyRate = variableSpend / daysElapsed

  // Project forward: everything already spent + expected future variable burn
  // + subscription costs not yet in transactions.
  const projectedTotal =
    monthToDateSpend + dailyRate * daysRemaining + Math.max(0, subscriptionMonthlyTotal)

  return { projectedTotal, dailyRate, daysElapsed, daysRemaining }
}
