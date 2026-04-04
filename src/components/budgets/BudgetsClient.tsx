"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatMoney } from "@/lib/utils/parser"
import { SPEND_CATEGORIES, type SpendCategory } from "@/types"
import type { Database } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"]

const CATEGORY_COLORS: Record<string, string> = {
  food: "from-emerald-500 to-emerald-600",
  rent: "from-blue-500 to-blue-600",
  travel: "from-sky-500 to-sky-600",
  subscriptions: "from-violet-500 to-violet-600",
  clothes: "from-pink-500 to-pink-600",
  entertainment: "from-amber-500 to-amber-600",
  misc: "from-gray-400 to-gray-500",
}

export function BudgetsClient({
  currency,
  month,
  initialBudgets,
  spentByCategory,
}: {
  currency: string
  month: string
  initialBudgets: BudgetRow[]
  spentByCategory: Partial<Record<SpendCategory, number>>
}) {
  const router = useRouter()
  const [budgets, setBudgets] = useState(initialBudgets)
  const [category, setCategory] = useState<SpendCategory>("food")
  const [limit, setLimit] = useState("")
  const [loading, setLoading] = useState(false)

  async function addBudget(e: React.FormEvent) {
    e.preventDefault()
    const monthly_limit = Number(limit)
    if (!Number.isFinite(monthly_limit) || monthly_limit <= 0) return
    setLoading(true)
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, monthly_limit, month }),
      })
      const row = await res.json()
      if (res.ok) {
        setBudgets((prev) => {
          const others = prev.filter((b) => b.category !== row.category)
          return [...others, row]
        })
        setLimit("")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" })
    if (res.ok) {
      setBudgets((b) => b.filter((x) => x.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <form
            onSubmit={addBudget}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as SpendCategory)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEND_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly limit</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-36"
              />
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              <Plus className="size-4" />
              Add budget
            </Button>
          </form>
        </CardContent>
      </Card>

      {budgets.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No budgets for {month} yet. Add one above.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((b) => {
            const spent = spentByCategory[b.category as SpendCategory] ?? 0
            const lim = Number.parseFloat(b.monthly_limit)
            const pct = lim > 0 ? Math.min(100, (spent / lim) * 100) : 0
            const hot = pct >= 90
            const warm = pct >= 80 && pct < 90
            const colorGrad =
              CATEGORY_COLORS[b.category] ?? CATEGORY_COLORS.misc

            return (
              <Card
                key={b.id}
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize">
                      {b.category}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(b.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium tabular-nums">
                      {formatMoney(spent, currency)}
                    </span>
                    <span className="text-muted-foreground">
                      of {formatMoney(lim, currency)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r transition-all",
                        hot
                          ? "from-red-500 to-red-600"
                          : warm
                            ? "from-amber-500 to-amber-600"
                            : colorGrad
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-muted-foreground">
                    {pct.toFixed(0)}% used
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
