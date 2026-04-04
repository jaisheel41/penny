/**
 * Project total spend by end of month using average daily burn so far.
 * Optional `subscriptionMonthlyTotal` adds known recurring costs for the month.
 */
export function projectMonthEndSpend(params: {
  monthToDateSpend: number
  referenceDate: Date
  subscriptionMonthlyTotal?: number
}): { projectedTotal: number; dailyRate: number; daysElapsed: number; daysRemaining: number } {
  const { monthToDateSpend, referenceDate, subscriptionMonthlyTotal = 0 } = params
  const y = referenceDate.getFullYear()
  const m = referenceDate.getMonth()
  const end = new Date(y, m + 1, 0)
  const daysInMonth = end.getDate()
  const dayOfMonth = referenceDate.getDate()

  const daysElapsed = Math.max(1, dayOfMonth)
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth)

  const variableSpend = Math.max(0, monthToDateSpend - subscriptionMonthlyTotal)
  const dailyRate = variableSpend / daysElapsed
  const projectedVariable = monthToDateSpend + dailyRate * daysRemaining
  const projectedTotal = projectedVariable + Math.max(0, subscriptionMonthlyTotal)

  return {
    projectedTotal,
    dailyRate,
    daysElapsed,
    daysRemaining,
  }
}
