"use client"

import { motion } from "framer-motion"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"

import {
  SPEND_DNA_COLORS,
  SPEND_DNA_LABELS,
  SPEND_DNA_ORDER,
  dominantSpendDnaCategory,
  type SpendDnaCategory,
} from "@/lib/insights/spend-dna"
import { MOTION } from "@/lib/motion/presets"

export type SpendDnaMonthSlice = {
  key: string
  label: string
  percentages: Record<SpendDnaCategory, number>
}

function radarRows(pct: Record<SpendDnaCategory, number>) {
  return SPEND_DNA_ORDER.map((id) => ({
    subject: SPEND_DNA_LABELS[id],
    id,
    value: Math.round(pct[id] * 10) / 10,
    color: SPEND_DNA_COLORS[id],
  }))
}

function DnaRadar(props: {
  data: ReturnType<typeof radarRows>
  dominantColor: string
  compact?: boolean
}) {
  const { data, dominantColor, compact } = props
  const tickFill = "var(--muted-foreground)"
  const gridStroke = "var(--border)"

  return (
    <RadarChart
      data={data}
      cx="50%"
      cy="50%"
      outerRadius={compact ? "65%" : "72%"}
      margin={
        compact
          ? { top: 4, right: 4, bottom: 4, left: 4 }
          : { top: 24, right: 24, bottom: 24, left: 24 }
      }
    >
      <PolarGrid stroke={gridStroke} strokeDasharray="3 3" />
      <PolarAngleAxis
        dataKey="subject"
        tick={{ fill: tickFill, fontSize: compact ? 9 : 12 }}
        tickLine={false}
      />
      <PolarRadiusAxis
        angle={90}
        domain={[0, 100]}
        tick={false}
        axisLine={false}
      />
      <Radar
        name="Spend"
        dataKey="value"
        stroke={dominantColor}
        strokeWidth={compact ? 1 : 1.5}
        fill={dominantColor}
        fillOpacity={0.15}
        isAnimationActive={false}
        dot={(dotProps) => {
          const { cx, cy, payload } = dotProps as {
            cx?: number
            cy?: number
            payload?: { color?: string }
          }
          if (cx == null || cy == null) return <g />
          const fill = payload?.color ?? dominantColor
          return (
            <circle
              cx={cx}
              cy={cy}
              r={compact ? 2.5 : 4}
              fill={fill}
              stroke="var(--card)"
              strokeWidth={1}
            />
          )
        }}
      />
    </RadarChart>
  )
}

export function SpendDNA(props: {
  archetype: string
  txCountThisMonth: number
  currentPercentages: Record<SpendDnaCategory, number>
  evolution: [SpendDnaMonthSlice, SpendDnaMonthSlice, SpendDnaMonthSlice]
}) {
  const { archetype, txCountThisMonth, currentPercentages, evolution } = props

  const dominant = dominantSpendDnaCategory(currentPercentages)
  const dominantColor = SPEND_DNA_COLORS[dominant]
  const mainData = radarRows(currentPercentages)

  if (txCountThisMonth < 10) {
    return (
      <section className="rounded-2xl border border-border bg-surface-inset p-6 shadow-elevation-sm">
        <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-foreground">Spend DNA</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Your spending personality, based on category mix this month.
            </p>
          </div>
        </div>
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 py-10 text-center">
          <p className="max-w-sm text-[15px] font-medium text-foreground">
            Add more transactions to reveal your Spend DNA
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            We need at least 10 transactions this month to build a meaningful profile.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-inset p-6 shadow-elevation-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">Spend DNA</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Share of spend by category this month.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-col items-center lg:max-w-[420px]">
          <span className="mb-4 inline-flex items-center rounded-full border border-penny-teal/30 bg-penny-teal-muted px-3 py-1.5 text-[13px] font-medium text-penny-teal">
            {archetype}
          </span>
          <motion.div
            className="h-[300px] w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: MOTION.slow, ease: MOTION.easeOutSoft }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <DnaRadar data={mainData} dominantColor={dominantColor} />
            </ResponsiveContainer>
          </motion.div>
        </div>

        <ul className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-2.5">
          {[...SPEND_DNA_ORDER].map((id) => (
            <li
              key={id}
              className="flex items-center justify-between gap-3 text-[14px]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: SPEND_DNA_COLORS[id] }}
                  aria-hidden
                />
                <span className="truncate font-medium text-foreground">
                  {SPEND_DNA_LABELS[id]}
                </span>
              </div>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {currentPercentages[id].toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Evolution
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {evolution.map((m) => {
            const d = dominantSpendDnaCategory(m.percentages)
            const color = SPEND_DNA_COLORS[d]
            return (
              <div key={m.key} className="flex flex-col items-center gap-2">
                <p className="text-center text-[11px] font-medium text-muted-foreground">
                  {m.label}
                </p>
                <div className="mx-auto h-[112px] w-full max-w-[132px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <DnaRadar
                      data={radarRows(m.percentages)}
                      dominantColor={color}
                      compact
                    />
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
