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
      style={{
        background: "#0d0d0c",
        borderRadius: "1rem",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        WebkitFontSmoothing: "antialiased",
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
          opacity: 0.4,
        }}
      />
      {/* Green ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-30%",
          left: "-20%",
          width: "80%",
          height: "70%",
          background:
            "radial-gradient(ellipse at center, rgba(34,197,94,0.12) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
          {/* Pulsing dot */}
          <span
            style={{
              display: "inline-block",
              width: "0.5rem",
              height: "0.5rem",
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
              flexShrink: 0,
            }}
            aria-hidden
          />
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#22c55e",
            }}
          >
            Penny says
          </p>
        </div>

        {/* Text */}
        <p
          style={{
            fontSize: "0.9375rem",
            lineHeight: 1.75,
            color: "rgba(240,239,233,0.82)",
          }}
        >
          {text}
        </p>

        {/* Footnote */}
        <p
          style={{
            marginTop: "0.875rem",
            fontSize: "0.72rem",
            lineHeight: 1.65,
            color: "rgba(240,239,233,0.28)",
          }}
        >
          Plain-language read based on this month&apos;s activity and income.
        </p>
      </div>
    </motion.div>
  )
}
