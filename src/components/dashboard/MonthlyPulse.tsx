"use client"

import { motion, useReducedMotion } from "framer-motion"

import { MOTION } from "@/lib/motion/presets"

export function MonthlyPulse({ text }: { text: string }) {
  const reduceMotion = useReducedMotion()
  const r = reduceMotion === true

  return (
    <motion.div
      whileHover={r ? undefined : { scale: 1.005 }}
      transition={{ duration: MOTION.fast }}
      className="rounded-2xl border border-penny-green/25 bg-penny-green-muted p-6 shadow-elevation-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block size-2 rounded-full bg-penny-green"
          aria-hidden
        />
        <p className="label-caps text-penny-green">Penny says</p>
      </div>

      <p className="text-[15px] leading-[1.75] text-foreground">{text}</p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Plain-language read based on this month&apos;s activity and income.
      </p>
    </motion.div>
  )
}
