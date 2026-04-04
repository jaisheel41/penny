"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, PiggyBank, RefreshCw } from "lucide-react"
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
    router.push(`/manage?tab=${key}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-xl bg-muted/60 p-1.5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              active === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}
