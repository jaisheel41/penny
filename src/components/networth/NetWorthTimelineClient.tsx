"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import confetti from "canvas-confetti"
import { motion, useReducedMotion } from "framer-motion"
import CountUp from "react-countup"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Plus, PiggyBank, TrendingUp, CreditCard } from "lucide-react"
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
import { MOTION } from "@/lib/motion/presets"
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

// ── Easing constant (matches DashboardContent) ──────────────────────────────
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ── Axis formatter ───────────────────────────────────────────────────────────
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

// ── Tooltip ──────────────────────────────────────────────────────────────────
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
    <div
      style={{
        borderRadius: "0.875rem",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#1c1c1a",
        padding: "0.75rem 0.9rem",
        fontSize: "13px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        minWidth: "160px",
      }}
    >
      <p style={{ fontWeight: 600, color: "#f0efe9" }}>
        {title}
        {isProj && (
          <span style={{ marginLeft: "0.375rem", fontSize: "11px", fontWeight: 400, color: "#60a5fa" }}>
            projected
          </span>
        )}
      </p>
      <p style={{ marginTop: "0.25rem", fontSize: "15px", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#4ade80" }}>
        {formatMoney(nw, currency)}
      </p>
      <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {[
          { label: "Savings", value: p.savings, color: "#4ade80" },
          { label: "Investments", value: p.investments, color: "#2dd4bf" },
          { label: "Pension", value: p.pension, color: "#60a5fa" },
          { label: "Property", value: p.property_equity, color: "#a78bfa" },
          { label: "Debt", value: p.total_debt, color: "#f87171" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "0.2rem" }}>
            <span style={{ fontSize: "11px", color: "rgba(240,239,233,0.4)" }}>{label}</span>
            <span style={{ fontSize: "11px", fontVariantNumeric: "tabular-nums", color, fontWeight: 500 }}>
              {formatMoney(value, currency)}
            </span>
          </div>
        ))}
      </div>
      {p.note ? (
        <p style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: "11px", fontStyle: "italic", color: "rgba(240,239,233,0.35)" }}>
          &ldquo;{p.note}&rdquo;
        </p>
      ) : null}
    </div>
  )
}

// ── Chart dot ────────────────────────────────────────────────────────────────
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
        stroke="#1a1a18"
        strokeWidth={2}
      />
    </g>
  )
}

// ── Delta display ────────────────────────────────────────────────────────────
function DeltaLine(props: {
  delta: number
  currency: string
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

// ── Hero delta pill (for dark card) ─────────────────────────────────────────
function HeroDeltaPill({ delta, currency }: { delta: number; currency: string }) {
  if (delta === 0) return null
  const positive = delta > 0
  const sign = positive ? "+" : ""
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.2rem 0.65rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        background: positive
          ? "rgba(34, 197, 94, 0.12)"
          : "rgba(239, 68, 68, 0.12)",
        border: `1px solid ${positive ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
        color: positive ? "#4ade80" : "#f87171",
      }}
    >
      {sign}{formatMoney(Math.abs(delta), currency)} vs last month
    </span>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export function NetWorthTimelineClient(props: {
  initialSnapshots: NetworthSnapshot[]
  currency: string
}) {
  const { currency } = props
  const reduceMotion = useReducedMotion()
  const r = reduceMotion === true

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

  const savingsCh = changeVsPrevious(sorted, (row) =>
    Number.parseFloat(row.savings || "0")
  )
  const invCh = changeVsPrevious(sorted, (row) =>
    Number.parseFloat(row.investments || "0")
  )
  const debtCh = changeVsPrevious(sorted, (row) =>
    Number.parseFloat(row.total_debt || "0")
  )
  const lastRow = sorted[sorted.length - 1]

  // ── Wealth composition bar ──────────────────────────────────────────────
  const compositionSegments = useMemo(() => {
    if (!lastRow) return []
    const s = Number.parseFloat(lastRow.savings || "0")
    const i = Number.parseFloat(lastRow.investments || "0")
    const p = Number.parseFloat(lastRow.pension || "0")
    const pe = Number.parseFloat(lastRow.property_equity || "0")
    const total = s + i + p + pe
    if (total === 0) return []
    return [
      { key: "savings", label: "Savings", value: s, color: "#22c55e", pct: (s / total) * 100 },
      { key: "investments", label: "Investments", value: i, color: "#2dd4bf", pct: (i / total) * 100 },
      { key: "pension", label: "Pension", value: p, color: "#60a5fa", pct: (p / total) * 100 },
      { key: "property", label: "Property", value: pe, color: "#a78bfa", pct: (pe / total) * 100 },
    ].filter((seg) => seg.value > 0)
  }, [lastRow])

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

  // ── Motion variants (mirrors DashboardContent) ──────────────────────────
  const sectionContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: r ? 0 : 0.08,
        delayChildren: r ? 0 : 0.2,
      },
    },
  }
  const sectionItem = {
    hidden: { opacity: 0, y: r ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: r ? 0 : 0.45, ease: MOTION.easeStandard },
    },
  }

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
    <div
      className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6 sm:py-8"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >

      {/* ── DARK HERO CARD ─────────────────────────────────────────────────── */}
      <motion.div
        initial={r ? false : { opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: r ? 0 : 0.55, ease }}
        style={{
          background: "#111110",
          borderRadius: "1.25rem",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          marginBottom: "1.25rem",
        }}
      >
        {/* Grain texture */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            opacity: 0.45,
          }}
        />
        {/* Ambient glow — top right */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-40%",
            right: "-10%",
            width: "50%",
            height: "160%",
            background:
              "radial-gradient(ellipse at center, rgba(34,197,94,0.1) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Ambient glow — bottom left */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-30%",
            left: "-5%",
            width: "40%",
            height: "110%",
            background:
              "radial-gradient(ellipse at center, rgba(13,148,136,0.07) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "clamp(1.5rem, 4vw, 2.25rem)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1.5rem",
          }}
        >
          {/* Left — heading + number + composition */}
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            {/* Split outlined + filled heading */}
            <h1
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                textTransform: "uppercase",
                lineHeight: 0.92,
                marginBottom: "1.25rem",
              }}
            >
              <motion.span
                initial={r ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: r ? 0 : 0.1, ease }}
                style={{
                  display: "block",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  WebkitTextStroke: "1.5px rgba(240,239,233,0.4)",
                }}
              >
                Net worth
              </motion.span>
              <motion.span
                initial={r ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: r ? 0 : 0.2, ease }}
                style={{
                  display: "block",
                  color: "#22c55e",
                  WebkitTextFillColor: "#22c55e",
                  WebkitTextStroke: "0px",
                }}
              >
                Timeline.
              </motion.span>
            </h1>

            {/* Net worth number with CountUp */}
            <motion.p
              initial={r ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: r ? 0 : 0.3 }}
              style={{
                fontSize: "clamp(2.5rem, 6vw, 3.75rem)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "#f0efe9",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <CountUp
                end={currentNw}
                duration={r ? 0 : 1.6}
                formattingFn={(n) => formatMoney(n, currency)}
                enableScrollSpy
                scrollSpyOnce
                preserveValue
              />
            </motion.p>

            {/* Delta pill */}
            <motion.div
              initial={r ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: r ? 0 : 0.45 }}
              style={{ marginTop: "0.625rem" }}
            >
              {nwChange && sorted.length >= 2 ? (
                <HeroDeltaPill delta={nwChange.delta} currency={currency} />
              ) : (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(240,239,233,0.35)",
                  }}
                >
                  Add another month to see change
                </span>
              )}
            </motion.div>

            {/* Wealth composition bar */}
            {compositionSegments.length > 0 && (
              <motion.div
                initial={r ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: r ? 0 : 0.55 }}
                style={{ marginTop: "1.5rem" }}
              >
                {/* Bar */}
                <div
                  style={{
                    height: "0.375rem",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    display: "flex",
                    gap: "2px",
                    background: "rgba(255,255,255,0.08)",
                  }}
                >
                  {compositionSegments.map((seg) => (
                    <motion.div
                      key={seg.key}
                      initial={r ? false : { width: 0 }}
                      animate={{ width: `${seg.pct}%` }}
                      transition={{
                        duration: r ? 0 : 1.1,
                        ease: "easeOut",
                        delay: r ? 0 : 0.65,
                      }}
                      style={{
                        height: "100%",
                        borderRadius: "9999px",
                        background: seg.color,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div
                  style={{
                    marginTop: "0.625rem",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem 1.25rem",
                  }}
                >
                  {compositionSegments.map((seg) => (
                    <span
                      key={seg.key}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.7rem",
                        color: "rgba(240,239,233,0.45)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "0.45rem",
                          height: "0.45rem",
                          borderRadius: "9999px",
                          background: seg.color,
                          flexShrink: 0,
                        }}
                      />
                      {seg.label}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right — CTA button */}
          <motion.div
            initial={r ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: r ? 0 : 0.35, ease }}
          >
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1.1rem",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.28)",
                color: "#4ade80",
                cursor: "pointer",
                transition: "background 0.2s ease, border-color 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.background = "rgba(34,197,94,0.2)"
                el.style.borderColor = "rgba(34,197,94,0.45)"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.background = "rgba(34,197,94,0.12)"
                el.style.borderColor = "rgba(34,197,94,0.28)"
              }}
            >
              <Plus style={{ width: "0.9rem", height: "0.9rem" }} />
              Add this month
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* ── STAGGERED SECTIONS ───────────────────────────────────────────────── */}
      <motion.div
        variants={sectionContainer}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >

        {/* ── CHART CARD ───────────────────────────────────────────────────── */}
        <motion.section
          variants={sectionItem}
          style={{
            position: "relative",
            borderRadius: "1.25rem",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "#1a1a18",
            overflow: "hidden",
            padding: "clamp(1.25rem, 3vw, 1.5rem)",
          }}
        >
          {/* Top ambient glow line */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.35), rgba(45,212,191,0.2), transparent)",
              pointerEvents: "none",
            }}
          />
          {/* Faint green radial at top-left */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-60%",
              left: "-10%",
              width: "40%",
              height: "120%",
              background: "radial-gradient(ellipse at center, rgba(34,197,94,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                marginBottom: "1.25rem",
                fontSize: "0.7rem",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "rgba(240,239,233,0.35)",
              }}
            >
              History &amp; projection
            </p>
            <div style={{ height: "clamp(280px, 40vw, 360px)", width: "100%", minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartPoints}
                  margin={{ top: 28, right: 12, left: 4, bottom: 8 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: "rgba(240,239,233,0.35)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v) => formatAxisCurrency(Number(v), currency)}
                    tick={{ fill: "rgba(240,239,233,0.35)", fontSize: 11 }}
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
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={(dotProps) => <ActualDot {...dotProps} />}
                    activeDot={{ r: 6, fill: "#22c55e", stroke: "#1a1a18" }}
                    connectNulls={false}
                    isAnimationActive
                    animationDuration={1200}
                  />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    name="Projected"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    connectNulls
                    isAnimationActive
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "11px",
                  color: "rgba(240,239,233,0.4)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "0.55rem",
                    height: "0.55rem",
                    borderRadius: "9999px",
                    background: "#22c55e",
                  }}
                />
                Actual
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "11px",
                  color: "rgba(240,239,233,0.4)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "1.4rem",
                    height: "0",
                    borderTop: "2px dashed #60a5fa",
                  }}
                />
                Projected (6 mo)
              </span>
            </div>
          </div>
        </motion.section>

        {/* ── BREAKDOWN GRID ───────────────────────────────────────────────── */}
        <motion.section
          variants={sectionItem}
          className="grid gap-3 sm:grid-cols-3"
        >
          <BreakdownCard
            title="Savings"
            icon={<PiggyBank style={{ width: "1rem", height: "1rem" }} />}
            accentColor="rgba(34,197,94,0.5)"
            iconBgColor="rgba(34,197,94,0.12)"
            iconTextColor="#4ade80"
            amount={Number.parseFloat(lastRow.savings || "0")}
            delta={savingsCh?.delta ?? null}
            currency={currency}
          />
          <BreakdownCard
            title="Investments"
            icon={<TrendingUp style={{ width: "1rem", height: "1rem" }} />}
            accentColor="rgba(45,212,191,0.5)"
            iconBgColor="rgba(45,212,191,0.12)"
            iconTextColor="#2dd4bf"
            amount={Number.parseFloat(lastRow.investments || "0")}
            delta={invCh?.delta ?? null}
            currency={currency}
          />
          <BreakdownCard
            title="Total debt"
            icon={<CreditCard style={{ width: "1rem", height: "1rem" }} />}
            accentColor="rgba(239,68,68,0.45)"
            iconBgColor="rgba(239,68,68,0.1)"
            iconTextColor="#f87171"
            amount={Number.parseFloat(lastRow.total_debt || "0")}
            delta={debtCh?.delta ?? null}
            currency={currency}
            debt
          />
        </motion.section>

        {/* ── MILESTONES ───────────────────────────────────────────────────── */}
        {milestones.length > 0 && (
          <motion.section
            variants={sectionItem}
            style={{
              borderRadius: "1.25rem",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#1a1a18",
              padding: "clamp(1.1rem, 3vw, 1.4rem)",
            }}
          >
            <p
              style={{
                marginBottom: "1rem",
                fontSize: "0.7rem",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "rgba(240,239,233,0.35)",
              }}
            >
              Milestones
            </p>
            <ul style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {milestones.map((m) => (
                <li
                  key={`${m.id}-${m.monthKey}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.3rem 0.8rem",
                    borderRadius: "9999px",
                    border: "1px solid rgba(34,197,94,0.22)",
                    background: "rgba(34,197,94,0.07)",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#4ade80",
                    transition: "background 0.2s ease, border-color 0.2s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    el.style.background = "rgba(34,197,94,0.14)"
                    el.style.borderColor = "rgba(34,197,94,0.38)"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    el.style.background = "rgba(34,197,94,0.07)"
                    el.style.borderColor = "rgba(34,197,94,0.22)"
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "0.35rem",
                      height: "0.35rem",
                      borderRadius: "9999px",
                      background: "#4ade80",
                      flexShrink: 0,
                    }}
                  />
                  {m.label}
                  <span style={{ color: "rgba(74,222,128,0.5)", marginLeft: "0.1rem" }}>
                    · {m.monthLabel}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ── PROJECTION BANNER ────────────────────────────────────────────── */}
        <motion.section
          variants={sectionItem}
          style={{
            position: "relative",
            borderRadius: "1.25rem",
            border: "1px solid rgba(255,255,255,0.07)",
            borderLeft: "3px solid rgba(34,197,94,0.55)",
            background: "#1a1a18",
            overflow: "hidden",
            padding: "clamp(1.1rem, 3vw, 1.4rem)",
            paddingLeft: "clamp(1.25rem, 3vw, 1.6rem)",
          }}
        >
          {/* Ambient green glow from left */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-20%",
              left: "-5%",
              width: "35%",
              height: "140%",
              background: "radial-gradient(ellipse at left center, rgba(34,197,94,0.1) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            {projection ? (
              <>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    color: "#f0efe9",
                  }}
                >
                  At your current rate you&apos;ll hit{" "}
                  <span style={{ color: "#4ade80", fontVariantNumeric: "tabular-nums" }}>
                    {formatMoney(projection.targetAmount, currency)}
                  </span>{" "}
                  by{" "}
                  <span style={{ color: "#4ade80" }}>{projection.monthLabel}</span>
                </p>
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8125rem",
                    color: "rgba(240,239,233,0.38)",
                    lineHeight: 1.5,
                  }}
                >
                  Based on average monthly change from your last three month-to-month moves. Not financial advice.
                </p>
              </>
            ) : (
              <>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#f0efe9",
                  }}
                >
                  Keep logging each month
                </p>
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8125rem",
                    color: "rgba(240,239,233,0.38)",
                    lineHeight: 1.5,
                  }}
                >
                  {sorted.length < 2
                    ? "Add at least two months of snapshots to estimate a trend."
                    : "Your recent trend isn\u2019t positive enough to project the next milestone \u2014 or you\u2019ve already passed our top target. Keep tracking!"}
                </p>
              </>
            )}
          </div>
        </motion.section>

      </motion.div>

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

// ── Breakdown card ────────────────────────────────────────────────────────────
function BreakdownCard(props: {
  title: string
  icon: React.ReactNode
  accentColor: string
  iconBgColor: string
  iconTextColor: string
  amount: number
  delta: number | null
  currency: string
  debt?: boolean
}) {
  const { title, icon, accentColor, iconBgColor, iconTextColor, amount, delta, currency, debt } = props
  const [hovered, setHovered] = useState(false)

  const deltaEl = (() => {
    if (delta === null) return <span style={{ fontSize: "12px", color: "rgba(240,239,233,0.3)" }}>—</span>
    if (delta === 0) return <span style={{ fontSize: "12px", color: "rgba(240,239,233,0.3)" }}>No change</span>
    const good = debt ? delta < 0 : delta > 0
    const sign = delta > 0 ? "+" : ""
    return (
      <span
        style={{
          fontSize: "12px",
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
          color: good ? "#4ade80" : "#f87171",
        }}
      >
        {sign}{formatMoney(Math.abs(delta), currency)} vs last month
      </span>
    )
  })()

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: "1.25rem",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.07)"}`,
        borderTop: `2px solid ${accentColor}`,
        background: hovered ? "rgba(255,255,255,0.04)" : "#1a1a18",
        padding: "1.25rem",
        transition: "border-color 0.2s ease, background 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Faint accent glow from top */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-50%",
          left: "20%",
          right: "20%",
          height: "80%",
          background: `radial-gradient(ellipse at top center, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(240,239,233,0.35)",
            }}
          >
            {title}
          </p>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1.875rem",
              height: "1.875rem",
              borderRadius: "0.5rem",
              background: iconBgColor,
              color: iconTextColor,
            }}
          >
            {icon}
          </span>
        </div>
        <p
          style={{
            fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            color: debt ? "#f87171" : "#f0efe9",
            lineHeight: 1,
          }}
        >
          {formatMoney(amount, currency)}
        </p>
        <div style={{ marginTop: "0.5rem" }}>
          {deltaEl}
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyNetWorth({ onAdd }: { onAdd: () => void }) {
  const reduceMotion = useReducedMotion()
  const r = reduceMotion === true

  return (
    <div
      className="mx-auto max-w-[520px] px-6 py-16"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >
      {/* Decorative illustration */}
      <motion.div
        initial={r ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mb-10 flex h-40 w-full max-w-[260px] items-center justify-center"
      >
        <div className="absolute size-28 rounded-full bg-penny-green-muted/90" />
        <div className="absolute -right-2 top-4 size-16 rounded-full bg-penny-teal-muted/70" />
        <div className="absolute bottom-2 left-0 size-12 rounded-full bg-amber-100/80 dark:bg-amber-900/30" />
        <div className="relative z-10 flex h-20 w-28 items-end justify-center rounded-2xl border-2 border-border bg-card shadow-elevation-sm">
          <div className="mb-2 flex h-10 w-16 items-end justify-around gap-1 px-1">
            <div className="h-4 w-2 rounded-sm bg-green-300 dark:bg-green-700" />
            <div className="h-7 w-2 rounded-sm bg-penny-green" />
            <div className="h-6 w-2 rounded-sm bg-penny-teal/70" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={r ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: r ? 0 : 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center"
      >
        <h1
          className="text-[24px] font-semibold text-foreground"
          style={{ letterSpacing: "-0.025em" }}
        >
          Start your financial story
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
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
      </motion.div>
    </div>
  )
}

// ── Add / update snapshot dialog ──────────────────────────────────────────────
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
