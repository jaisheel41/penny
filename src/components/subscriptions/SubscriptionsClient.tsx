"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { CalendarDays, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatMoney } from "@/lib/utils/parser"
import type { Database } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

type Row = Database["public"]["Tables"]["subscriptions"]["Row"]

export function SubscriptionsClient({
  currency,
  initial,
}: {
  currency: string
  initial: Row[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [renewalDay, setRenewalDay] = useState("1")
  const [loading, setLoading] = useState(false)

  const monthlyTotal = useMemo(() => {
    return rows
      .filter((r) => r.active)
      .reduce((s, r) => s + Number.parseFloat(r.amount), 0)
  }, [rows])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const a = Number(amount)
    const rd = Number(renewalDay)
    if (!name.trim() || !Number.isFinite(a) || a <= 0) return
    if (!Number.isInteger(rd) || rd < 1 || rd > 31) return
    setLoading(true)
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: a,
          renewal_day: rd,
        }),
      })
      const row = await res.json()
      if (res.ok) {
        setRows((r) =>
          [...r, row].sort((a, b) => a.name.localeCompare(b.name))
        )
        setName("")
        setAmount("")
        setRenewalDay("1")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(row: Row, active: boolean) {
    const res = await fetch(`/api/subscriptions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
    const updated = await res.json()
    if (res.ok) {
      setRows((r) => r.map((x) => (x.id === row.id ? updated : x)))
      router.refresh()
    }
  }

  async function remove(row: Row) {
    const res = await fetch(`/api/subscriptions/${row.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setRows((r) => r.filter((x) => x.id !== row.id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-violet-500/10 via-primary/5 to-transparent p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Active monthly total
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {formatMoney(monthlyTotal, currency)}
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <form onSubmit={add} className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Netflix"
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount / month</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <Label>Renewal day</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={renewalDay}
                onChange={(e) => setRenewalDay(e.target.value)}
                className="w-24"
              />
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              <Plus className="size-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No subscriptions yet. Add one above.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <Card
              key={r.id}
              className={cn(
                "overflow-hidden transition-all hover:shadow-md",
                !r.active && "opacity-60"
              )}
            >
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums">
                      {formatMoney(Number.parseFloat(r.amount), currency)}
                      <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                        / month
                      </span>
                    </p>
                  </div>
                  <Switch
                    checked={r.active ?? true}
                    onCheckedChange={(v) => toggleActive(r, v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" />
                    Renews day {r.renewal_day}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(r)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
