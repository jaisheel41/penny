"use client"

import { motion, useReducedMotion } from "framer-motion"
import { TrendingUp, AlertTriangle, ArrowRight } from "lucide-react"
import CountUp from "react-countup"

import { formatMoney } from "@/lib/utils/parser"
import { MOTION } from "@/lib/motion/presets"

export function ForecastBar(props: {
  currency: string
  projectedTotal: number
  monthlyIncome: number
  dailyRate: number
  daysRemaining: number
  totalSpent: number
}) {
  const {
    currency,
    projectedTotal,
    monthlyIncome,
    dailyRate,
    daysRemaining,
    totalSpent,
  } = props

  const reduceMotion = useReducedMotion()
  const r = reduceMotion === true

  const over = monthlyIncome > 0 && projectedTotal > monthlyIncome
  const pct =
    monthlyIncome > 0
      ? Math.min(100, (totalSpent / monthlyIncome) * 100)
      : 0

  const barColor = over ? "#f87171" : pct >= 70 ? "#d97706" : "#22c55e"
  const borderColor = over
    ? "rgba(248,113,113,0.18)"
    : "rgba(255,255,255,0.08)"
  const bgTint = over
    ? "rgba(248,113,113,0.04)"
    : "rgba(255,255,255,0.04)"

  let narrative = ""
  if (monthlyIncome <= 0) {
    narrative = "Set monthly income in Settings to compare spend against what you earn."
  } else if (over) {
    narrative = "At your current daily pace, month-end spend is projected to go over income."
  } else if (pct >= 85) {
    narrative = "You have used most of this month's income — discretionary room is tight."
  } else if (pct >= 70) {
    narrative = "You are past the halfway mark; keep an eye on variable categories."
  } else {
    narrative = "You are pacing under your income for the month so far."
  }

  return (
    <motion.div
      whileHover={r ? undefined : { scale: 1.003 }}
      transition={{ duration: MOTION.fast }}
      style={{
        background: bgTint,
        border: `1px solid ${borderColor}`,
        borderRadius: "1rem",
        padding: "1.5rem",
        transition: "border-color 0.2s ease",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {over ? (
          <AlertTriangle style={{ width: "1rem", height: "1rem", color: "#f87171", flexShrink: 0 }} />
        ) : (
          <TrendingUp style={{ width: "1rem", height: "1rem", color: "#22c55e", flexShrink: 0 }} />
        )}
        <p
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(240,239,233,0.35)",
          }}
        >
          Month-end forecast
        </p>
      </div>

      {/* Big number */}
      <p
        style={{
          marginTop: "0.5rem",
          fontSize: "2.25rem",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "#f0efe9",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <CountUp
          end={projectedTotal}
          duration={r ? 0 : 1.2}
          decimals={2}
          formattingFn={(n) => formatMoney(n, currency)}
          enableScrollSpy
          scrollSpyOnce
        />
      </p>

      {/* Meta row */}
      <div
        style={{
          marginTop: "0.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.375rem 0.75rem",
          fontSize: "0.8rem",
          color: "rgba(240,239,233,0.35)",
        }}
      >
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatMoney(dailyRate, currency)}/day
        </span>
        <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
        <span>{daysRemaining} days left</span>
        {monthlyIncome > 0 && (
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: barColor,
            }}
          >
            {over ? (
              <>
                <AlertTriangle style={{ width: "0.75rem", height: "0.75rem" }} />
                Over by {formatMoney(projectedTotal - monthlyIncome, currency)}
              </>
            ) : (
              <>
                <ArrowRight style={{ width: "0.75rem", height: "0.75rem" }} />
                {formatMoney(monthlyIncome - projectedTotal, currency)} buffer
              </>
            )}
          </span>
        )}
      </div>

      {/* Narrative */}
      <p
        style={{
          marginTop: "0.75rem",
          fontSize: "0.8rem",
          lineHeight: 1.65,
          color: "rgba(240,239,233,0.3)",
        }}
      >
        {narrative}
      </p>

      {/* Progress bar */}
      {monthlyIncome > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <div
            style={{
              height: "0.5rem",
              borderRadius: "9999px",
              overflow: "hidden",
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <motion.div
              initial={r ? { width: `${pct}%` } : { width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: r ? 0 : 1.2, ease: "easeOut", delay: r ? 0 : 0.4 }}
              style={{
                height: "100%",
                borderRadius: "9999px",
                background: barColor,
              }}
            />
          </div>
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.68rem",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span style={{ fontWeight: 600, color: barColor }}>
              {formatMoney(totalSpent, currency)} spent
            </span>
            <span style={{ color: "rgba(240,239,233,0.28)" }}>
              {Math.round(pct)}% of income
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
