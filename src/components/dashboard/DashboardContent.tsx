"use client"

import { useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { CalendarDays, RefreshCw, Receipt } from "lucide-react"
import CountUp from "react-countup"

import { QuickAdd } from "@/components/dashboard/QuickAdd"
import { ForecastBar } from "@/components/dashboard/ForecastBar"
import { MonthlyPulse } from "@/components/dashboard/MonthlyPulse"
import { CategoryBars } from "@/components/dashboard/CategoryBars"
import { formatMoney } from "@/lib/utils/parser"
import { MOTION } from "@/lib/motion/presets"
import type { SpendCategory } from "@/types"

export interface DashboardData {
  greeting: string
  displayDate: string
  currency: string
  monthlyIncome: number
  displayMonth: string
  monthTotal: number
  txCount: number
  subCount: number
  subTotal: number
  projectedTotal: number
  dailyRate: number
  daysRemaining: number
  pulseText: string
  dayOfMonth: number
  totalDaysInMonth: number
  byCategory: Partial<Record<SpendCategory, number>>
}

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ── Shared dark glass card style ────────────────────────────────────────────
const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1rem",
  transition: "border-color 0.2s ease, background 0.2s ease",
}

export function DashboardContent({ data }: { data: DashboardData }) {
  const quickAddRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const r = reduceMotion === true

  const {
    greeting,
    displayDate,
    currency,
    monthlyIncome,
    displayMonth,
    monthTotal,
    txCount,
    subCount,
    subTotal,
    projectedTotal,
    dailyRate,
    daysRemaining,
    pulseText,
    dayOfMonth,
    totalDaysInMonth,
    byCategory,
  } = data

  const monthProgressPct = Math.min(
    100,
    Math.round((dayOfMonth / totalDaysInMonth) * 100)
  )
  const hasCategoryData = Object.values(byCategory).some((v) => (v ?? 0) > 0)

  // ── Split greeting into outlined + filled parts ─────────────────────────
  const hasName = greeting.includes(", ")
  const outlinedPart = hasName
    ? greeting.split(", ")[0].toUpperCase() + ","
    : greeting.split(" ").slice(0, -1).join(" ").toUpperCase()
  const filledPart = hasName
    ? greeting.split(", ")[1].toUpperCase() + "."
    : (greeting.split(" ").pop() ?? greeting).toUpperCase() + "."

  // ── Motion variants ─────────────────────────────────────────────────────
  const gridContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: r ? 0 : 0.07,
        delayChildren: r ? 0 : 0.15,
      },
    },
  }

  const gridItem = {
    hidden: { opacity: 0, y: r ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: r ? 0 : 0.4, ease: MOTION.easeStandard },
    },
  }

  function scrollToQuickAdd() {
    quickAddRef.current?.scrollIntoView({
      behavior: r ? "auto" : "smooth",
      block: "center",
    })
    setTimeout(
      () => quickAddRef.current?.querySelector("input")?.focus(),
      r ? 0 : 350
    )
  }

  return (
    <div
      className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >

      {/* ── DARK HEADER CARD ──────────────────────────────────────────── */}
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
        {/* Ambient glow — top left */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-40%",
            left: "-15%",
            width: "55%",
            height: "180%",
            background:
              "radial-gradient(ellipse at center, rgba(34,197,94,0.1) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Ambient glow — bottom right */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-30%",
            right: "-5%",
            width: "40%",
            height: "110%",
            background:
              "radial-gradient(ellipse at center, rgba(13,148,136,0.06) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "clamp(1.5rem, 4vw, 2.25rem)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "1.25rem",
          }}
        >
          <div>
            {/* Outlined + filled headline */}
            <h1
              style={{
                fontSize: "clamp(1.9rem, 4vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                textTransform: "uppercase",
                lineHeight: 0.9,
                marginBottom: "1rem",
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
                  WebkitTextStroke: "1.5px rgba(240,239,233,0.45)",
                }}
              >
                {outlinedPart}
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
                {filledPart}
              </motion.span>
            </h1>

            {/* Date + month progress pill */}
            <motion.div
              initial={r ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: r ? 0 : 0.35 }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "0.625rem",
              }}
            >
              <p style={{ fontSize: "0.825rem", color: "rgba(240,239,233,0.38)" }}>
                {displayDate}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "3rem",
                    height: "0.25rem",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.1)",
                  }}
                >
                  <motion.div
                    initial={r ? false : { width: 0 }}
                    animate={{ width: `${monthProgressPct}%` }}
                    transition={{ duration: 1.1, ease: "easeOut", delay: r ? 0 : 0.45 }}
                    style={{
                      position: "absolute",
                      inset: "0 auto 0 0",
                      borderRadius: "9999px",
                      background: "#22c55e",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontVariantNumeric: "tabular-nums",
                    color: "rgba(240,239,233,0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Day {dayOfMonth}/{totalDaysInMonth}
                </span>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.button
            type="button"
            onClick={scrollToQuickAdd}
            initial={r ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={r ? undefined : { scale: 1.04, y: -1 }}
            whileTap={r ? undefined : { scale: 0.97 }}
            transition={{ duration: r ? 0 : 0.45, ease }}
            style={{
              alignSelf: "flex-start",
              padding: "0.6875rem 1.5rem",
              borderRadius: "9999px",
              background: "#22c55e",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "#0d0d0c",
              letterSpacing: "-0.01em",
              fontFamily: "var(--font-geist-sans)",
              boxShadow:
                "rgba(0,0,0,0.3) 0px 2px 4px, rgba(34,197,94,0.3) 0px 4px 18px",
            }}
          >
            + Add expense
          </motion.button>
        </div>
      </motion.div>

      {/* ── STATS GRID ────────────────────────────────────────────────── */}
      <motion.div
        variants={gridContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[3fr_2fr]"
      >
        {/* ── HERO STAT: Spent this month ─────────────────────────── */}
        <motion.div
          variants={gridItem}
          className="sm:col-span-2 lg:col-span-1 lg:row-span-3"
        >
          <div
            style={{
              height: "100%",
              background: "#111110",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "1rem",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "clamp(1.5rem, 3vw, 2rem)",
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
            {/* Glow */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: "-20%",
                right: "-10%",
                width: "60%",
                height: "70%",
                background:
                  "radial-gradient(ellipse at center, rgba(34,197,94,0.08) 0%, transparent 65%)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Upper */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <p
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(240,239,233,0.35)",
                  }}
                >
                  Spent this month
                </p>
                <div
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "0.625rem",
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                    color: "#22c55e",
                  }}
                >
                  £
                </div>
              </div>

              {/* Dominant number */}
              <p
                style={{
                  marginTop: "1.25rem",
                  fontSize: "clamp(2.75rem, 6vw, 3.75rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  color: "#f0efe9",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <CountUp
                  end={monthTotal}
                  duration={r ? 0 : 1.4}
                  decimals={2}
                  separator=","
                  formattingFn={(n) => formatMoney(n, currency)}
                  enableScrollSpy
                  scrollSpyOnce
                />
              </p>

              <div
                style={{
                  marginTop: "0.75rem",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "0.5rem 0.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "rgba(240,239,233,0.35)",
                  }}
                >
                  {txCount} transaction{txCount !== 1 ? "s" : ""}
                </span>
                <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "rgba(240,239,233,0.35)",
                  }}
                >
                  {displayMonth}
                </span>
              </div>
            </div>

            {/* Month progress bar */}
            <div style={{ position: "relative", zIndex: 1, marginTop: "2rem" }}>
              <div
                style={{
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.68rem",
                  fontVariantNumeric: "tabular-nums",
                  color: "rgba(240,239,233,0.26)",
                }}
              >
                <span>
                  Day {dayOfMonth} of {totalDaysInMonth}
                </span>
                <span>{monthProgressPct}% of month elapsed</span>
              </div>
              <div
                style={{
                  height: "0.375rem",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                <motion.div
                  initial={r ? false : { width: 0 }}
                  animate={{ width: `${monthProgressPct}%` }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: r ? 0 : 0.5 }}
                  style={{
                    height: "100%",
                    borderRadius: "9999px",
                    background: "rgba(34,197,94,0.52)",
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── COMPACT STAT: Daily average ──────────────────────────── */}
        <motion.div variants={gridItem}>
          <motion.div
            whileHover={r ? undefined : { scale: 1.004, borderColor: "rgba(255,255,255,0.14)" }}
            transition={{ duration: MOTION.fast }}
            style={{
              ...glassCard,
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.125rem 1.25rem",
            }}
          >
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                flexShrink: 0,
                borderRadius: "0.625rem",
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarDays
                style={{ width: "1.0625rem", height: "1.0625rem", color: "#d97706" }}
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(240,239,233,0.35)",
                }}
              >
                Daily average
              </p>
              <p
                style={{
                  marginTop: "0.25rem",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: "#f0efe9",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <CountUp
                  end={dailyRate}
                  duration={r ? 0 : 1.1}
                  decimals={2}
                  formattingFn={(n) => formatMoney(n, currency)}
                  enableScrollSpy
                  scrollSpyOnce
                />
              </p>
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: "0.75rem",
                fontVariantNumeric: "tabular-nums",
                color: "rgba(240,239,233,0.3)",
              }}
            >
              {daysRemaining}d left
            </span>
          </motion.div>
        </motion.div>

        {/* ── COMPACT STAT: Subscriptions ──────────────────────────── */}
        <motion.div variants={gridItem}>
          <motion.div
            whileHover={r ? undefined : { scale: 1.004 }}
            transition={{ duration: MOTION.fast }}
            style={{
              ...glassCard,
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.125rem 1.25rem",
            }}
          >
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                flexShrink: 0,
                borderRadius: "0.625rem",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RefreshCw
                style={{ width: "1.0625rem", height: "1.0625rem", color: "#22c55e" }}
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(240,239,233,0.35)",
                }}
              >
                Subscriptions
              </p>
              <p
                style={{
                  marginTop: "0.25rem",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: "#f0efe9",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <CountUp
                  end={subTotal}
                  duration={r ? 0 : 1.1}
                  decimals={2}
                  formattingFn={(n) => formatMoney(n, currency)}
                  enableScrollSpy
                  scrollSpyOnce
                />
              </p>
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: "0.75rem",
                fontVariantNumeric: "tabular-nums",
                color: "rgba(240,239,233,0.3)",
              }}
            >
              {subCount} active
            </span>
          </motion.div>
        </motion.div>

        {/* ── COMPACT STAT: Transactions ───────────────────────────── */}
        <motion.div variants={gridItem}>
          <motion.div
            whileHover={r ? undefined : { scale: 1.004 }}
            transition={{ duration: MOTION.fast }}
            style={{
              ...glassCard,
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.125rem 1.25rem",
            }}
          >
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                flexShrink: 0,
                borderRadius: "0.625rem",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Receipt
                style={{
                  width: "1.0625rem",
                  height: "1.0625rem",
                  color: "rgba(240,239,233,0.5)",
                }}
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(240,239,233,0.35)",
                }}
              >
                Transactions
              </p>
              <p
                style={{
                  marginTop: "0.25rem",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: "#f0efe9",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <CountUp
                  end={txCount}
                  duration={r ? 0 : 1.0}
                  separator=","
                  enableScrollSpy
                  scrollSpyOnce
                />
              </p>
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: "0.75rem",
                color: "rgba(240,239,233,0.3)",
              }}
            >
              {displayMonth}
            </span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── QUICK ADD ─────────────────────────────────────────────────── */}
      <motion.div
        ref={quickAddRef}
        initial={r ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: r ? 0 : 0.45, ease: MOTION.easeOutSoft, delay: r ? 0 : 0.3 }}
      >
        <QuickAdd />
      </motion.div>

      {/* ── FORECAST + PULSE ──────────────────────────────────────────── */}
      <motion.div
        initial={r ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: r ? 0 : 0.45, ease: MOTION.easeOutSoft, delay: r ? 0 : 0.4 }}
        className="grid gap-4 lg:grid-cols-[3fr_2fr]"
      >
        <ForecastBar
          currency={currency}
          projectedTotal={projectedTotal}
          monthlyIncome={monthlyIncome}
          dailyRate={dailyRate}
          daysRemaining={daysRemaining}
          totalSpent={monthTotal}
        />
        <MonthlyPulse text={pulseText} />
      </motion.div>

      {/* ── CATEGORY BREAKDOWN ────────────────────────────────────────── */}
      {hasCategoryData && (
        <motion.div
          initial={r ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: r ? 0 : 0.45, ease: MOTION.easeOutSoft, delay: r ? 0 : 0.5 }}
        >
          <CategoryBars
            currency={currency}
            byCategory={byCategory}
            totalSpent={monthTotal}
          />
        </motion.div>
      )}
    </div>
  )
}
