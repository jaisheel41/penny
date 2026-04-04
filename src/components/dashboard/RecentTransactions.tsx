import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { formatMoney } from "@/lib/utils/parser"
import type { Database } from "@/lib/supabase/types"

type Row = Database["public"]["Tables"]["transactions"]["Row"]

export function RecentTransactions({
  rows,
  currency,
}: {
  rows: Row[]
  currency: string
}) {
  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h3 className="text-sm font-semibold">Recent transactions</h3>
        <Link
          href="/manage?tab=transactions"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <ul className="divide-y">
        {rows.slice(0, 5).map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/30"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.merchant}</p>
              <p className="text-xs text-muted-foreground">
                <span className="capitalize">{r.category}</span>
                <span className="mx-1.5 text-border">·</span>
                {r.date}
              </p>
            </div>
            <span className="ml-4 shrink-0 text-sm font-semibold tabular-nums">
              {formatMoney(Number.parseFloat(r.amount), currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
