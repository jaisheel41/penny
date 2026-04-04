import type { ParsedSpend } from "@/types"

/**
 * Parse a one-line spend like "Deliveroo £18" or "18.50 coffee shop".
 * Takes the last plausible currency amount in the string.
 */
export function parseSpendLine(line: string): ParsedSpend | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  let currencySymbol: string | undefined
  if (trimmed.includes("£")) currencySymbol = "£"
  else if (trimmed.includes("€")) currencySymbol = "€"
  else if (trimmed.includes("$")) currencySymbol = "$"

  const matches = [...trimmed.matchAll(/([\d,]+(?:\.\d{1,2})?)/g)]
  if (matches.length === 0) return null

  const lastNum = matches[matches.length - 1]
  const raw = lastNum[1].replace(/,/g, "")
  const amount = Number.parseFloat(raw)
  if (!Number.isFinite(amount) || amount <= 0) return null

  let merchantPart = trimmed
    .replace(/£|€|\$|USD|EUR|GBP/gi, " ")
    .replace(/[\d,]+(?:\.\d{1,2})?/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!merchantPart) {
    merchantPart = "Spend"
  }

  return {
    merchant: merchantPart,
    amount,
    currencySymbol,
  }
}

export function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode.length === 3 ? currencyCode : "GBP",
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}
