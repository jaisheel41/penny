"use client"

import type { LucideIcon } from "lucide-react"
import CountUp from "react-countup"
import { motion, useReducedMotion } from "framer-motion"

import { formatMoney } from "@/lib/utils/parser"
import { cn } from "@/lib/utils"
import { MOTION } from "@/lib/motion/presets"

interface StatCardProps {
  title: string
  /** Numeric value — animated with CountUp */
  value: number
  /** How to display the value */
  format: "currency" | "integer"
  currencyCode?: string
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
}

export function StatCard({
  title,
  value,
  format,
  currencyCode = "GBP",
  subtitle,
  icon: Icon,
  iconColor = "text-penny-green",
  iconBg = "bg-penny-green-muted",
}: StatCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { scale: 1.005 }}
      transition={{ duration: MOTION.fast }}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-elevation-sm transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-elevation-md"
    >
      <div className="flex items-center justify-between">
        <p className="label-caps text-muted-foreground">{title}</p>
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          <Icon className={cn("size-[18px]", iconColor)} />
        </div>
      </div>

      <div>
        <p className="number-display text-[32px] leading-none text-foreground">
          {format === "currency" ? (
            <CountUp
              end={value}
              duration={reduceMotion ? 0 : 1.2}
              decimals={2}
              separator=","
              formattingFn={(n) => formatMoney(n, currencyCode)}
              enableScrollSpy
              scrollSpyOnce
            />
          ) : (
            <CountUp
              end={value}
              duration={reduceMotion ? 0 : 1}
              separator=","
              enableScrollSpy
              scrollSpyOnce
            />
          )}
        </p>
        {subtitle && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )
}
