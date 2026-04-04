"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Sparkles, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function QuickAdd() {
  const router = useRouter()
  const [line, setLine] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!line.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: line }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to add")
        return
      }
      setLine("")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-background to-primary/[0.02] p-5 shadow-sm">
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-primary/5 blur-xl" />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Quick add</h3>
            <p className="text-xs text-muted-foreground">
              Type merchant and amount in one line
            </p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="quickadd"
              placeholder='e.g. Deliveroo £18'
              value={line}
              onChange={(e) => setLine(e.target.value)}
              autoComplete="off"
              className="h-10 bg-background/80 pl-3 pr-3 backdrop-blur-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !line.trim()}
            className="h-10 gap-1.5 px-4"
          >
            {loading ? (
              <Sparkles className="size-3.5 animate-pulse" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {loading ? "Adding…" : "Add"}
          </Button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
        {success && (
          <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Added successfully.
          </p>
        )}
      </div>
    </div>
  )
}
