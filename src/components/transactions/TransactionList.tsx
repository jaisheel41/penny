"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

type Row = Database["public"]["Tables"]["transactions"]["Row"]

export function TransactionList({
  initial,
  month,
  currency = "GBP",
}: {
  initial: Row[]
  month: string
  currency?: string
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [loading, setLoading] = useState(false)

  async function refresh() {
    const res = await fetch(`/api/transactions?month=${month}`)
    const data = await res.json()
    if (res.ok) setRows(data)
    router.refresh()
  }

  async function saveEdit() {
    if (!editing) return
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: editing.merchant,
          amount: Number(editing.amount),
          category: editing.category,
          note: editing.note,
          date: editing.date,
        }),
      })
      if (res.ok) {
        setEditing(null)
        await refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/${deleting.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDeleting(null)
        await refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Merchant
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {" "}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No transactions this month.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={r.id}
                  className={cn(
                    "transition-colors hover:bg-muted/30",
                    idx % 2 === 0 ? "bg-transparent" : "bg-muted/15"
                  )}
                >
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {r.date}
                  </td>
                  <td className="px-4 py-3 font-medium">{r.merchant}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="inline-flex items-center rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                      {r.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatMoney(Number.parseFloat(r.amount), currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditing({ ...r })}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleting(r)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Merchant</Label>
                <Input
                  value={editing.merchant}
                  onChange={(e) =>
                    setEditing({ ...editing, merchant: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editing.amount}
                  onChange={(e) =>
                    setEditing({ ...editing, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editing.category}
                  onValueChange={(v) =>
                    setEditing({ ...editing, category: v as SpendCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEND_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editing.date}
                  onChange={(e) =>
                    setEditing({ ...editing, date: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={loading}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete transaction?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
