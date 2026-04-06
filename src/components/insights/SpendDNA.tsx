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
      <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
      <PolarAngleAxis
        dataKey="subject"
        tick={{ fill: "rgba(240,239,233,0.38)", fontSize: compact ? 9 : 12 }}
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
        fillOpacity={compact ? 0.12 : 0.18}
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
              stroke="#111110"
              strokeWidth={1.5}
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

  // ── Not enough data ────────────────────────────────────────────────────
  if (txCountThisMonth < 10) {
    return (
      <section
        style={{
          background: "#111110",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1rem",
          padding: "1.5rem",
          position: "relative",
          overflow: "hidden",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* Grain */}
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
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <h2
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#f0efe9",
              }}
            >
              Spend DNA
            </h2>
            <p
              style={{
                marginTop: "0.25rem",
                fontSize: "0.8rem",
                color: "rgba(240,239,233,0.38)",
              }}
            >
              Your spending personality, based on category mix this month.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "12rem",
              gap: "0.5rem",
              textAlign: "center",
              padding: "2.5rem 0",
            }}
          >
            <p
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#f0efe9",
                maxWidth: "22rem",
              }}
            >
              Add more transactions to reveal your Spend DNA
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                lineHeight: 1.65,
                color: "rgba(240,239,233,0.35)",
                maxWidth: "18rem",
              }}
            >
              We need at least 10 transactions this month to build a meaningful
              profile.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // ── Full Spend DNA ─────────────────────────────────────────────────────
  return (
    <section
      style={{
        background: "#111110",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "1rem",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Grain */}
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
      {/* Ambient glow using dominant color */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-30%",
          right: "-10%",
          width: "50%",
          height: "80%",
          background: `radial-gradient(ellipse at center, ${dominantColor}18 0%, transparent 65%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#f0efe9",
            }}
          >
            Spend DNA
          </h2>
          <p
            style={{
              marginTop: "0.25rem",
              fontSize: "0.8rem",
              color: "rgba(240,239,233,0.38)",
            }}
          >
            Share of spend by category this month.
          </p>
        </div>

        {/* Main content: radar + legend */}
        <div
          className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10"
        >
          {/* Radar */}
          <div
            className="flex min-w-0 flex-1 flex-col items-center lg:max-w-[420px]"
          >
            {/* Archetype badge */}
            <span
              style={{
                marginBottom: "1rem",
                display: "inline-flex",
                alignItems: "center",
                padding: "0.3rem 0.875rem",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
                background: `${dominantColor}18`,
                border: `1px solid ${dominantColor}40`,
                color: dominantColor,
              }}
            >
              {archetype}
            </span>
            <motion.div
              style={{ height: "18.75rem", width: "100%" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: MOTION.slow, ease: MOTION.easeOutSoft }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <DnaRadar data={mainData} dominantColor={dominantColor} />
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Legend */}
          <ul
            className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-2.5"
          >
            {[...SPEND_DNA_ORDER].map((id) => (
              <li
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  fontSize: "0.875rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      width: "0.625rem",
                      height: "0.625rem",
                      flexShrink: 0,
                      borderRadius: "50%",
                      background: SPEND_DNA_COLORS[id],
                    }}
                    aria-hidden
                  />
                  <span
                    style={{
                      fontWeight: 500,
                      color: "rgba(240,239,233,0.75)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {SPEND_DNA_LABELS[id]}
                  </span>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                    color: "rgba(240,239,233,0.35)",
                    fontSize: "0.8rem",
                  }}
                >
                  {currentPercentages[id].toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Evolution ─────────────────────────────────────────── */}
        <div
          style={{
            marginTop: "2.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h3
            style={{
              marginBottom: "1.25rem",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(240,239,233,0.3)",
            }}
          >
            Evolution
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {evolution.map((m) => {
              const d = dominantSpendDnaCategory(m.percentages)
              const color = SPEND_DNA_COLORS[d]
              return (
                <div
                  key={m.key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: "rgba(240,239,233,0.35)",
                    }}
                  >
                    {m.label}
                  </p>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "8.25rem",
                      height: "7rem",
                      margin: "0 auto",
                    }}
                  >
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
      </div>
    </section>
  )
}
