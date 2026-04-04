"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CURRENCIES } from "@/lib/utils/currencies"

export function SettingsForm({
  email,
  initial,
}: {
  email: string
  initial: {
    name: string
    currency: string
    monthly_income: string
    email_notifications: boolean
  }
}) {
  const router = useRouter()
  const [name, setName] = useState(initial.name)
  const [currency, setCurrency] = useState(initial.currency)
  const [monthlyIncome, setMonthlyIncome] = useState(initial.monthly_income)
  const [emailNotifications, setEmailNotifications] = useState(
    initial.email_notifications
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          currency: currency || "GBP",
          monthly_income: monthlyIncome,
          email_notifications: emailNotifications,
        }),
      })
      if (res.ok) {
        setMessage("Saved.")
        router.refresh()
      } else {
        const j = await res.json()
        setMessage(j.error ?? "Failed to save")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select value={currency} onValueChange={(v) => { if (v) setCurrency(v) }}>
          <SelectTrigger id="currency" className="w-full">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="font-mono text-muted-foreground">
                  {c.symbol}
                </span>{" "}
                {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="income">Monthly income estimate</Label>
        <Input
          id="income"
          type="number"
          step="0.01"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Used for overspend warnings and forecasts.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="notif">Email notifications</Label>
          <p className="text-xs text-muted-foreground">
            Digests and budget alerts
          </p>
        </div>
        <Switch
          id="notif"
          checked={emailNotifications}
          onCheckedChange={setEmailNotifications}
        />
      </div>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  )
}
