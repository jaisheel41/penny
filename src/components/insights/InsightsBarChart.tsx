"use client"

import { motion, useReducedMotion } from "framer-motion"

import { formatMoney } from "@/lib/utils/parser"

export function InsightsBarChart({
  currency,
  bars,
}: {
  currency: string
  bars: {
    key: string
    label: string
    total: number
    pct: number
    isCurrent: boolean
  }[]
}) {
  const r = useReducedMotion() === true

  return (
    <div
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
        {/* Section label */}
        <p
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(240,239,233,0.35)",
            marginBottom: "1.5rem",
          }}
        >
          Monthly spending
        </p>

        {/* Bars */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "clamp(0.75rem, 2vw, 1.5rem)",
            height: "9rem",
          }}
        >
          {bars.map((bar, idx) => (
            <div
              key={bar.key}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              {/* Amount label above bar */}
              <motion.p
                initial={r ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: r ? 0 : 0.1 + idx * 0.07 }}
                style={{
                  fontSize: "clamp(0.65rem, 1.2vw, 0.78rem)",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: bar.isCurrent ? 700 : 400,
                  color: bar.isCurrent
                    ? "#22c55e"
                    : "rgba(240,239,233,0.3)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {formatMoney(bar.total, currency)}
              </motion.p>

              {/* Bar column */}
              <div
                style={{
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  position: "relative",
                }}
              >
                {/* Glow behind current month bar */}
                {bar.isCurrent && (
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "150%",
                      height: `${Math.max(bar.pct, 4)}%`,
                      background:
                        "radial-gradient(ellipse at bottom, rgba(34,197,94,0.22) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                )}
                <motion.div
                  initial={r ? false : { scaleY: 0, originY: 1 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: r ? 0 : 0.65,
                    ease: [0.22, 1, 0.36, 1],
                    delay: r ? 0 : 0.15 + idx * 0.08,
                  }}
                  style={{
                    width: "100%",
                    height: `${Math.max(bar.pct, 4)}%`,
                    minHeight: "0.5rem",
                    borderRadius: "0.375rem 0.375rem 0 0",
                    background: bar.isCurrent
                      ? "linear-gradient(to top, rgba(34,197,94,0.7), rgba(34,197,94,0.9))"
                      : "rgba(255,255,255,0.08)",
                    transformOrigin: "bottom",
                    border: bar.isCurrent
                      ? "1px solid rgba(34,197,94,0.35)"
                      : "1px solid rgba(255,255,255,0.05)",
                    borderBottom: "none",
                  }}
                />
              </div>

              {/* Month label below bar */}
              <p
                style={{
                  fontSize: "0.72rem",
                  fontWeight: bar.isCurrent ? 600 : 400,
                  color: bar.isCurrent
                    ? "rgba(240,239,233,0.75)"
                    : "rgba(240,239,233,0.28)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {bar.label}
              </p>
            </div>
          ))}
        </div>

        {/* Baseline rule */}
        <div
          style={{
            marginTop: "0",
            height: "1px",
            background: "rgba(255,255,255,0.07)",
          }}
        />
      </div>
    </div>
  )
}
