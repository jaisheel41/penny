/**
 * Shared motion values — pair with `prefers-reduced-motion` in components
 * (Framer respects reduced motion when isAnimationActive: "auto" where applicable).
 */
export const MOTION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  easeStandard: [0.25, 0.46, 0.45, 0.94] as const,
  /** Softer ease for section reveals */
  easeOutSoft: [0.22, 1, 0.36, 1] as const,
} as const

export const pageFade = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.slow, ease: MOTION.easeStandard },
  },
}
