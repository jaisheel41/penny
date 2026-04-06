"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CreditCard, PiggyBank, RefreshCw } from "lucide-react"

import { MOTION } from "@/lib/motion/presets"

const tabs = [
  { key: "transactions", label: "Transactions", icon: CreditCard },
  { key: "budgets", label: "Budgets", icon: PiggyBank },
  { key: "subscriptions", label: "Subscriptions", icon: RefreshCw },
] as const

export type ManageTab = (typeof tabs)[number]["key"]

export function ManageTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = (searchParams.get("tab") as ManageTab) || "transactions"

  function switchTab(key: string) {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set("tab", key)
    current.delete("category")
    router.push(`/manage?${current.toString()}`)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "0.875rem",
          padding: "0.3rem",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              style={{
                position: "relative",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.6rem 1rem",
                borderRadius: "0.625rem",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "0.825rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#f0efe9" : "rgba(240,239,233,0.42)",
                transition: "color 0.15s ease",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255,255,255,0.07)",
                    borderRadius: "0.625rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "0.9rem",
                  height: "0.9rem",
                  flexShrink: 0,
                  color: isActive ? "#22c55e" : "rgba(240,239,233,0.3)",
                }}
              />
              <span className="relative z-10 hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.base, ease: MOTION.easeOutSoft }}
      >
        {children}
      </motion.div>
    </div>
  )
}
