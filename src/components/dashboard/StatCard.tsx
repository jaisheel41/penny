import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function StatCard(props: {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
}) {
  const {
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = "text-primary",
    iconBg = "bg-primary/10",
  } = props

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute -right-3 -top-3 size-16 rounded-full bg-muted/30 blur-xl" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            iconBg
          )}
        >
          <Icon className={cn("size-4", iconColor)} />
        </div>
      </div>
    </div>
  )
}
