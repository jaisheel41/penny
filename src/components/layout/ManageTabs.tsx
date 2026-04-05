"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CreditCard, PiggyBank, RefreshCw } from "lucide-react"

import { MOTION } from "@/lib/motion/presets"
import { cn } from "@/lib/utils"

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
    // Preserve month param, drop category on tab switch
    current.delete("category")
    router.push(`/manage?${current.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl border border-border bg-surface-inset/80 p-1.5 shadow-inner">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-card shadow-elevation-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 size-4 shrink-0",
                  isActive ? "text-penny-green" : "text-muted-foreground/70"
                )}
              />
              <span className="relative z-10 hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content with entrance animation */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: MOTION.base,
          ease: MOTION.easeOutSoft,
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
