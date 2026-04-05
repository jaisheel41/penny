"use client"

import { useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Wallet, CalendarDays, RefreshCw, Receipt } from "lucide-react"

import { StatCard } from "@/components/dashboard/StatCard"
import { QuickAdd } from "@/components/dashboard/QuickAdd"
import { ForecastBar } from "@/components/dashboard/ForecastBar"
import { MonthlyPulse } from "@/components/dashboard/MonthlyPulse"
import { MOTION } from "@/lib/motion/presets"

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
}

export function DashboardContent({ data }: { data: DashboardData }) {
  const quickAddRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const r = reduceMotion === true

  const pageVariants = {
    hidden: { opacity: 0, y: r ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: r ? 0 : MOTION.slow,
        ease: MOTION.easeStandard,
      },
    },
  }

  const gridContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: r ? 0 : 0.1,
        delayChildren: r ? 0 : 0.15,
      },
    },
  }

  const gridItem = {
    hidden: { opacity: 0, y: r ? 0 : 24, scale: r ? 1 : 0.97 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: r ? 0 : 0.4,
        ease: MOTION.easeStandard,
      },
    },
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: r ? 0 : 16 },
    show: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: r ? 0 : 0.4,
        ease: MOTION.easeOutSoft,
        delay: r ? 0 : delay,
      },
    }),
  }

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
  } = data

  function scrollToQuickAdd() {
    quickAddRef.current?.scrollIntoView({ behavior: r ? "auto" : "smooth", block: "center" })
    setTimeout(
      () => {
        const input = quickAddRef.current?.querySelector("input")
        input?.focus()
      },
      r ? 0 : 350
    )
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-[1200px] space-y-8 px-8 py-8"
    >
      <motion.div
        initial={r ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: r ? 0 : 0.4, ease: MOTION.easeOutSoft }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <h1 className="heading-tight text-2xl leading-tight text-foreground sm:text-[26px]">
            {greeting}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {displayDate}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Add today&apos;s spend below, then scan the forecast to see if you&apos;re on pace for the
            month.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={scrollToQuickAdd}
          whileHover={r ? undefined : { scale: 1.04 }}
          whileTap={r ? undefined : { scale: 0.97 }}
          transition={{ duration: MOTION.fast }}
          className="mt-1 self-start rounded-full bg-penny-green px-5 py-2.5 text-sm font-medium text-white shadow-elevation-sm transition-colors hover:bg-penny-green-hover hover:shadow-elevation-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:mt-0 sm:self-auto"
        >
          + Add expense
        </motion.button>
      </motion.div>

      <motion.div
        variants={gridContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={gridItem}>
          <StatCard
            title="Spent this month"
            value={monthTotal}
            format="currency"
            currencyCode={currency}
            subtitle={`${txCount} transaction${txCount !== 1 ? "s" : ""}`}
            icon={Wallet}
            iconColor="text-penny-green"
            iconBg="bg-penny-green-muted"
          />
        </motion.div>
        <motion.div variants={gridItem}>
          <StatCard
            title="Daily average"
            value={dailyRate}
            format="currency"
            currencyCode={currency}
            subtitle={`${daysRemaining} days remaining`}
            icon={CalendarDays}
            iconColor="text-penny-amber"
            iconBg="bg-amber-50 dark:bg-amber-950/40"
          />
        </motion.div>
        <motion.div variants={gridItem}>
          <StatCard
            title="Subscriptions"
            value={subTotal}
            format="currency"
            currencyCode={currency}
            subtitle={`${subCount} active`}
            icon={RefreshCw}
            iconColor="text-penny-green"
            iconBg="bg-penny-green-muted"
          />
        </motion.div>
        <motion.div variants={gridItem}>
          <StatCard
            title="Transactions"
            value={txCount}
            format="integer"
            subtitle={displayMonth}
            icon={Receipt}
            iconColor="text-muted-foreground"
            iconBg="bg-muted"
          />
        </motion.div>
      </motion.div>

      <motion.div
        ref={quickAddRef}
        custom={0.3}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
      >
        <QuickAdd />
      </motion.div>

      <motion.div
        custom={0.4}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
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
    </motion.div>
  )
}
