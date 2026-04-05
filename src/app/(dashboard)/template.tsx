"use client"

import { motion, useReducedMotion } from "framer-motion"

import { MOTION } from "@/lib/motion/presets"

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className="min-h-0">{children}</div>
  }

  return (
    <motion.div
      className="min-h-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.base,
        ease: MOTION.easeStandard,
      }}
    >
      {children}
    </motion.div>
  )
}
