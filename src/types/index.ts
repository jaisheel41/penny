import type { Database } from "@/lib/supabase/types"

export type SpendCategory =
  | "rent"
  | "groceries"
  | "food"
  | "travel"
  | "subscriptions"
  | "clothes"
  | "entertainment"
  | "misc"

export const SPEND_CATEGORIES: SpendCategory[] = [
  "rent",
  "groceries",
  "food",
  "travel",
  "subscriptions",
  "clothes",
  "entertainment",
  "misc",
]

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"]
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]
export type Budget = Database["public"]["Tables"]["budgets"]["Row"]
export type Goal = Database["public"]["Tables"]["goals"]["Row"]
export type NetworthSnapshot = Database["public"]["Tables"]["networth_snapshots"]["Row"]

export interface ParsedSpend {
  merchant: string
  amount: number
  currencySymbol?: string
}
