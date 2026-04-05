"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import confetti from "canvas-confetti"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import type { NetworthSnapshot } from "@/types"
import { formatMoney } from "@/lib/utils/parser"
import {
  changeVsPrevious,
  netWorthFromSnapshot,
  sortSnapshotsByMonthAsc,
} from "@/lib/networth/compute"
import { collectAllMilestones } from "@/lib/networth/milestones"
import {
  buildChartSeries,
  projectionHitDate,
  type ChartPoint,
} from "@/lib/networth/projection"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function formatAxisCurrency(v: number, currency: string): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) {
    const m = v / 1_000_000
    const s = m >= 10 || m === Math.floor(m) ? m.toFixed(0) : m.toFixed(1)
    return `£${s}m`
  }
  if (abs >= 1000) {
    const k = v / 1000
    const s = k >= 10 || k === Math.floor(k) ? k.toFixed(0) : k.toFixed(1)
    return `£${s}k`
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length === 3 ? currency : "GBP",
      maximumFractionDigits: 0,
    }).format(v)
  } catch {
    return `£${Math.round(v)}`
  }
}

function NetWorthTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: unknown
  currency: string
}) {
  const items = payload as { payload?: ChartPoint }[] | undefined
  if (!active || !items?.length) return null
  const p = items[0]?.payload
  if (!p) return null
  const title = p.monthKey
  const nw = p.actual ?? p.projected ?? p.netWorth
  const isProj = p.isProjection
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] shadow-lg">
      <p className="font-semibold text-foreground">
        {title}
        {isProj && (
          <span className="ml-1.5 text-[11px] font-normal text-blue-600">
            (projected)
          </span>
        )}
      </p>
      <p className="mt-1 text-[15px] font-bold tabular-nums text-penny-green">
        {formatMoney(nw, currency)}
      </p>
      <div className="mt-2 space-y-0.5 border-t border-border pt-2 text-[12px] text-muted-foreground">
        <p>Savings {formatMoney(p.savings, currency)}</p>
        <p>Investments {formatMoney(p.investments, currency)}</p>
        <p>Pension {formatMoney(p.pension, currency)}</p>
        <p>Property {formatMoney(p.property_equity, currency)}</p>
        <p className="text-destructive">
          Debt {formatMoney(p.total_debt, currency)}
        </p>
      </div>
      {p.note ? (
        <p className="mt-2 border-t border-border pt-2 text-[11px] italic text-muted-foreground">
          “{p.note}”
        </p>
      ) : null}
    </div>
  )
}

function ActualDot(props: {
  cx?: number
  cy?: number
  payload?: ChartPoint
}) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || payload?.actual == null) return null
  const big = payload.milestoneDot
  const r = big ? 7 : 4
  return (
    <g className="recharts-dot-actual">
      {big && payload.milestoneLabel ? (
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize={10}
          fontWeight={600}
        >
          {payload.milestoneLabel}
        </text>
      ) : null}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="var(--penny-green)"
        stroke="var(--card)"
        strokeWidth={2}
      />
    </g>
  )
}

function DeltaLine(props: {
  delta: number
  currency: string
  /** When true, negative delta is “good” (e.g. debt down). */
  invertGood?: boolean
}) {
  const { delta, currency, invertGood } = props
  if (delta === 0) {
    return <span className="text-[13px] text-muted-foreground">No change</span>
  }
  const good = invertGood ? delta < 0 : delta > 0
  const sign = delta > 0 ? "+" : ""
  return (
    <span
      className={cn(
        "text-[13px] font-medium tabular-nums",
        good ? "text-penny-green" : "text-destructive"
      )}
    >
      {sign}
      {formatMoney(Math.abs(delta), currency)} vs last month
    </span>
  )
}

export function NetWorthTimelineClient(props: {
  initialSnapshots: NetworthSnapshot[]
  currency: string
}) {
  const { currency } = props
  const [snapshots, setSnapshots] = useState<NetworthSnapshot[]>(
    props.initialSnapshots
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const sorted = useMemo(
    () => sortSnapshotsByMonthAsc(snapshots),
    [snapshots]
  )
  const { points: chartPoints } = useMemo(
    () => buildChartSeries(sorted),
    [sorted]
  )
  const milestones = useMemo(() => collectAllMilestones(sorted), [sorted])

  const currentNw = sorted.length
    ? netWorthFromSnapshot(sorted[sorted.length - 1])
    : 0
  const nwChange = changeVsPrevious(sorted, netWorthFromSnapshot)

  const projection = useMemo(
    () => (sorted.length ? projectionHitDate(sorted, currentNw) : null),
    [sorted, currentNw]
  )

  const savingsCh = changeVsPrevious(sorted, (r) =>
    Number.parseFloat(r.savings || "0")
  )
  const invCh = changeVsPrevious(sorted, (r) =>
    Number.parseFloat(r.investments || "0")
  )
  const debtCh = changeVsPrevious(sorted, (r) =>
    Number.parseFloat(r.total_debt || "0")
  )
  const lastRow = sorted[sorted.length - 1]

  const refresh = useCallback(async () => {
    const res = await fetch("/api/networth")
    if (!res.ok) return
    const data = (await res.json()) as NetworthSnapshot[]
    setSnapshots(Array.isArray(data) ? data : [])
  }, [])

  const currentMonth = format(new Date(), "yyyy-MM")
  const existingMonths = useMemo(
    () => new Set(sorted.map((s) => s.month)),
    [sorted]
  )

  if (sorted.length === 0) {
    return (
      <>
        <EmptyNetWorth onAdd={() => setDialogOpen(true)} />
        <AddSnapshotDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currency={currency}
          currentMonth={currentMonth}
          existingMonths={existingMonths}
          saving={saving}
          setSaving={setSaving}
          wasEmpty
          onSaved={async () => {
            await refresh()
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 } })
            toast.success("First snapshot saved — your timeline has begun.")
          }}
        />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-[24px] font-semibold text-foreground"
            style={{ letterSpacing: "-0.025em" }}
          >
            Net worth timeline
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Track wealth over time and peek at where you might be headed.
          </p>
          <p
            className="mt-4 text-[40px] font-bold tabular-nums leading-none text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            {formatMoney(currentNw, currency)}
          </p>
          {nwChange && sorted.length >= 2 ? (
            <div className="mt-2">
              <DeltaLine delta={nwChange.delta} currency={currency} />
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-muted-foreground">
              Add another month to see change vs last month.
            </p>
          )}
        </div>
        <Button
          type="button"
          className="inline-flex shrink-0 gap-2 self-start sm:self-auto"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4" />
          Add this month
        </Button>
      </header>

      <section className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          History & projection
        </p>
        <div className="h-[320px] w-full min-w-0 sm:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartPoints}
              margin={{ top: 28, right: 12, left: 4, bottom: 8 }}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(v) =>
                  formatAxisCurrency(Number(v), currency)
                }
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                content={(tipProps) => (
                  <NetWorthTooltip
                    active={tipProps.active}
                    payload={tipProps.payload}
                    currency={currency}
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="var(--penny-green)"
                strokeWidth={2.5}
                dot={(dotProps) => <ActualDot {...dotProps} />}
                activeDot={{
                  r: 6,
                  fill: "var(--penny-green)",
                  stroke: "var(--card)",
                }}
                connectNulls={false}
                isAnimationActive
                animationDuration={1200}
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected"
                stroke="var(--chart-3)"
                strokeWidth={2}
                strokeDasharray="6 6"
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive
                animationDuration={1200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full bg-penny-green" />
            Actual
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-0.5 w-6 border-t-2 border-dashed border-chart-3" />
            Projected (6 mo)
          </span>
        </div>
      </section>

      {milestones.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Milestones
          </h2>
          <ul className="flex flex-wrap gap-2">
            {milestones.map((m) => (
              <li
                key={`${m.id}-${m.monthKey}`}
                className="rounded-full border border-penny-green/30 bg-penny-green-muted px-3 py-1.5 text-[12px] font-medium text-penny-green"
              >
                {m.label}
                <span className="ml-1.5 text-penny-green/80">· {m.monthLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <BreakdownCard
          title="Savings"
          amount={Number.parseFloat(lastRow.savings || "0")}
          delta={savingsCh?.delta ?? null}
          currency={currency}
        />
        <BreakdownCard
          title="Investments"
          amount={Number.parseFloat(lastRow.investments || "0")}
          delta={invCh?.delta ?? null}
          currency={currency}
        />
        <BreakdownCard
          title="Total debt"
          amount={Number.parseFloat(lastRow.total_debt || "0")}
          delta={debtCh?.delta ?? null}
          currency={currency}
          debt
        />
      </section>

      <section
        className="rounded-2xl border border-penny-green/25 bg-penny-green-muted p-5 sm:p-6"
        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.6)" }}
      >
        {projection ? (
          <>
            <p className="text-[15px] font-semibold leading-snug text-penny-green">
              At your current rate you&apos;ll hit{" "}
              <span className="tabular-nums text-penny-green-hover">
                {formatMoney(projection.targetAmount, currency)}
              </span>{" "}
              by{" "}
              <span className="text-penny-green-hover">{projection.monthLabel}</span>
            </p>
            <p className="mt-2 text-[13px] text-penny-green-hover/80">
              Based on average monthly change from your last three month-to-month
              moves. Not financial advice.
            </p>
          </>
        ) : (
          <>
            <p className="text-[15px] font-semibold text-penny-green">
              Keep logging each month
            </p>
            <p className="mt-2 text-[13px] text-penny-green-hover/75">
              {sorted.length < 2
                ? "Add at least two months of snapshots to estimate a trend."
                : "Your recent trend isn’t positive enough to project the next milestone — or you’ve already passed our top target. Keep tracking!"}
            </p>
          </>
        )}
      </section>

      <AddSnapshotDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currency={currency}
        currentMonth={currentMonth}
        existingMonths={existingMonths}
        saving={saving}
        setSaving={setSaving}
        wasEmpty={false}
        onSaved={refresh}
      />
    </div>
  )
}

function BreakdownCard(props: {
  title: string
  amount: number
  delta: number | null
  currency: string
  debt?: boolean
}) {
  const { title, amount, delta, currency, debt } = props
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {title}
      </p>
      <p
        className={cn(
          "mt-2 text-[22px] font-bold tabular-nums",
          debt ? "text-destructive" : "text-foreground"
        )}
      >
        {formatMoney(amount, currency)}
      </p>
      {delta !== null ? (
        <div className="mt-2">
          <DeltaLine delta={delta} currency={currency} invertGood={debt} />
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-muted-foreground">—</p>
      )}
    </div>
  )
}

function EmptyNetWorth({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mx-auto max-w-[560px] px-8 py-12">
      <div className="relative mx-auto mb-10 flex h-40 w-full max-w-[280px] items-center justify-center">
        <div className="absolute size-24 rounded-full bg-penny-green-muted/90" />
        <div className="absolute -right-2 top-4 size-16 rounded-full bg-sky-200/70 dark:bg-sky-900/40" />
        <div className="absolute bottom-2 left-0 size-12 rounded-full bg-amber-200/80 dark:bg-amber-900/40" />
        <div className="relative z-10 flex h-20 w-28 items-end justify-center rounded-2xl border-2 border-border bg-card shadow-sm">
          <div className="mb-2 flex h-10 w-16 items-end justify-around gap-1 px-1">
            <div className="h-4 w-2 rounded-sm bg-green-300 dark:bg-green-700" />
            <div className="h-7 w-2 rounded-sm bg-penny-green" />
            <div className="h-6 w-2 rounded-sm bg-green-400 dark:bg-green-600" />
          </div>
        </div>
      </div>
      <h1
        className="text-center text-[24px] font-semibold text-foreground"
        style={{ letterSpacing: "-0.025em" }}
      >
        Start your financial story
      </h1>
      <p className="mt-2 text-center text-[15px] text-muted-foreground">
        Add your first snapshot — it only takes 2 minutes
      </p>
      <div className="mt-8 flex justify-center">
        <Button
          type="button"
          size="lg"
          className="gap-2 px-8"
          onClick={onAdd}
        >
          <Plus className="size-5" />
          Add snapshot
        </Button>
      </div>
    </div>
  )
}

function AddSnapshotDialog(props: {
  open: boolean
  onOpenChange: (o: boolean) => void
  currency: string
  currentMonth: string
  existingMonths: Set<string>
  saving: boolean
  setSaving: (v: boolean) => void
  wasEmpty: boolean
  onSaved: () => void | Promise<void>
}) {
  const {
    open,
    onOpenChange,
    currency,
    currentMonth,
    existingMonths,
    saving,
    setSaving,
    wasEmpty,
    onSaved,
  } = props

  const [month, setMonth] = useState(currentMonth)
  const [savings, setSavings] = useState("")
  const [investments, setInvestments] = useState("")
  const [pension, setPension] = useState("")
  const [propertyEquity, setPropertyEquity] = useState("")
  const [totalDebt, setTotalDebt] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (open) setMonth(currentMonth)
  }, [open, currentMonth])

  const isUpdate = existingMonths.has(month)

  const submit = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/networth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          savings: Number(savings || 0),
          investments: Number(investments || 0),
          pension: Number(pension || 0),
          property_equity: Number(propertyEquity || 0),
          total_debt: Number(totalDebt || 0),
          note: note.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        toast.error(typeof j.error === "string" ? j.error : "Save failed")
        return
      }
      onOpenChange(false)
      if (!wasEmpty) {
        toast.success(isUpdate ? "Snapshot updated" : "Snapshot saved")
      }
      await onSaved()
      setSavings("")
      setInvestments("")
      setPension("")
      setPropertyEquity("")
      setTotalDebt("")
      setNote("")
      setMonth(currentMonth)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add this month</DialogTitle>
          <DialogDescription>
            Log balances for {currency}. Values are in your profile currency.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div>
            <Label htmlFor="nw-month">Month</Label>
            <Input
              id="nw-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1.5"
            />
            {isUpdate ? (
              <p className="mt-1 text-[12px] text-muted-foreground">
                You already have a snapshot for this month — saving will update
                it.
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="nw-savings">Savings</Label>
            <Input
              id="nw-savings"
              type="number"
              min={0}
              step="0.01"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              className="mt-1.5"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="nw-inv">Investments</Label>
            <Input
              id="nw-inv"
              type="number"
              min={0}
              step="0.01"
              value={investments}
              onChange={(e) => setInvestments(e.target.value)}
              className="mt-1.5"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="nw-pension">Pension</Label>
            <Input
              id="nw-pension"
              type="number"
              min={0}
              step="0.01"
              value={pension}
              onChange={(e) => setPension(e.target.value)}
              className="mt-1.5"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="nw-prop">Property equity</Label>
            <Input
              id="nw-prop"
              type="number"
              min={0}
              step="0.01"
              value={propertyEquity}
              onChange={(e) => setPropertyEquity(e.target.value)}
              className="mt-1.5"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="nw-debt">Total debt</Label>
            <Input
              id="nw-debt"
              type="number"
              min={0}
              step="0.01"
              value={totalDebt}
              onChange={(e) => setTotalDebt(e.target.value)}
              className="mt-1.5"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="nw-note">Note (optional)</Label>
            <Textarea
              id="nw-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5 min-h-[72px] resize-none"
              placeholder="Got a pay rise this month"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={submit}>
            {saving ? "Saving…" : isUpdate ? "Update snapshot" : "Save snapshot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
