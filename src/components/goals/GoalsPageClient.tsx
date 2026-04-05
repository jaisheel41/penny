"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

import type { Goal } from "@/types"
import { formatMoney } from "@/lib/utils/parser"
import {
  celebrateMilestone,
  goalAmounts,
  hydrateMilestoneState,
  highestMilestonePct,
  milestoneToastMessage,
  monthsAway,
  progressPercent,
  readMilestoneState,
  writeMilestoneState,
} from "@/lib/goals/math"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

const SLIDER_MIN = 50
const SLIDER_MAX = 1000
const SLIDER_STEP = 25

const PICKER_EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💍", "🎓", "🏖️", "💻", "🐶", "🌴"]

function clampStep(value: number): number {
  const v = Math.round(value / SLIDER_STEP) * SLIDER_STEP
  return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, v))
}

function monthsPhrase(months: number | null): string {
  if (months === null) return "—"
  if (months <= 0) return "0 months away"
  return `${months} month${months === 1 ? "" : "s"} away`
}

function processMilestoneAfterSave(before: Goal, after: Goal) {
  const { target: t, saved: s0 } = goalAmounts(before)
  const { saved: s1 } = goalAmounts(after)
  if (t <= 0) return
  const oldPct = progressPercent(t, s0)
  const newPct = progressPercent(t, s1)
  const state = readMilestoneState()
  const prev = Math.max(
    state[after.id] ?? 0,
    highestMilestonePct(oldPct)
  )
  const next = highestMilestonePct(newPct)
  if (next > prev && next >= 25) {
    const crossed = next as 25 | 50 | 75 | 100
    celebrateMilestone(crossed)
    toast.success(milestoneToastMessage(after.name, crossed))
    state[after.id] = crossed
    writeMilestoneState(state)
  }
}

export function GoalsPageClient(props: {
  initialGoals: Goal[]
  currency: string
}) {
  const { currency } = props
  const [goals, setGoals] = useState<Goal[]>(props.initialGoals)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formEmoji, setFormEmoji] = useState("🎯")
  const [formName, setFormName] = useState("")
  const [formTarget, setFormTarget] = useState("")
  const [formMonthly, setFormMonthly] = useState("")
  const [formSaved, setFormSaved] = useState("0")

  const refreshGoals = useCallback(async () => {
    const res = await fetch("/api/goals")
    if (!res.ok) return
    const data = (await res.json()) as Goal[]
    setGoals(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    hydrateMilestoneState(goals)
  }, [goals])

  const primary = goals[0]
  const secondary = goals.slice(1)

  const primaryNums = primary ? goalAmounts(primary) : null
  const progress = primaryNums
    ? progressPercent(primaryNums.target, primaryNums.saved)
    : 0
  const baseMonths = primaryNums
    ? monthsAway(primaryNums.target, primaryNums.saved, primaryNums.monthly)
    : null

  const [whatIfMonthly, setWhatIfMonthly] = useState(SLIDER_MIN)
  useEffect(() => {
    if (!primary) return
    const monthly = Number.parseFloat(primary.monthly_contribution)
    const base = Number.isFinite(monthly) && monthly > 0 ? monthly : SLIDER_MIN
    setWhatIfMonthly(clampStep(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, base))))
  }, [primary?.id, primary?.monthly_contribution])

  const whatIfMonths = primaryNums
    ? monthsAway(primaryNums.target, primaryNums.saved, whatIfMonthly)
    : null

  const [savedDraft, setSavedDraft] = useState("")
  useEffect(() => {
    if (primary) {
      setSavedDraft(Number.parseFloat(primary.saved_amount).toString())
    }
  }, [primary?.id, primary?.saved_amount])

  const resetForm = () => {
    setFormEmoji("🎯")
    setFormName("")
    setFormTarget("")
    setFormMonthly("")
    setFormSaved("0")
  }

  const submitNewGoal = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emoji: formEmoji,
          name: formName,
          target_amount: Number(formTarget),
          monthly_contribution: Number(formMonthly),
          saved_amount: Number(formSaved || 0),
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        toast.error(typeof j.error === "string" ? j.error : "Could not create goal")
        return
      }
      resetForm()
      setSheetOpen(false)
      await refreshGoals()
      toast.success("Goal added")
    } finally {
      setSaving(false)
    }
  }

  const saveProgress = async () => {
    if (!primary) return
    const before = primary
    const nextSaved = Number.parseFloat(savedDraft)
    if (!Number.isFinite(nextSaved) || nextSaved < 0) {
      toast.error("Invalid amount")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/goals/${primary.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved_amount: nextSaved }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        toast.error(typeof j.error === "string" ? j.error : "Update failed")
        return
      }
      const updated = (await res.json()) as Goal
      processMilestoneAfterSave(before, updated)
      setGoals((g) => g.map((x) => (x.id === updated.id ? updated : x)))
      toast.success("Progress saved")
    } finally {
      setSaving(false)
    }
  }

  const removeGoal = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Could not remove goal")
        return
      }
      await refreshGoals()
      toast.success("Goal removed")
    } finally {
      setDeletingId(null)
    }
  }

  const sliderMarks = useMemo(() => {
    const m: number[] = []
    for (let v = SLIDER_MIN; v <= SLIDER_MAX; v += SLIDER_STEP) m.push(v)
    return m
  }, [])

  if (!primary) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-[24px] font-semibold text-foreground"
              style={{ letterSpacing: "-0.025em" }}
            >
              Goals
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Save toward what matters — one milestone at a time.
            </p>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              className={cn(buttonVariants(), "inline-flex shrink-0 gap-2")}
            >
              <Plus className="size-4" />
              Add goal
            </SheetTrigger>
            <AddGoalSheetContent
              formEmoji={formEmoji}
              setFormEmoji={setFormEmoji}
              formName={formName}
              setFormName={setFormName}
              formTarget={formTarget}
              setFormTarget={setFormTarget}
              formMonthly={formMonthly}
              setFormMonthly={setFormMonthly}
              formSaved={formSaved}
              setFormSaved={setFormSaved}
              saving={saving}
              onSubmit={submitNewGoal}
            />
          </Sheet>
        </div>
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-[15px] font-medium text-foreground">No goals yet</p>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Add your first goal to see progress and month estimates.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] px-8 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-[24px] font-semibold text-foreground"
            style={{ letterSpacing: "-0.025em" }}
          >
            Goals
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Your top priority and the rest of the list.
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            className={cn(buttonVariants(), "inline-flex shrink-0 gap-2")}
          >
            <Plus className="size-4" />
            Add goal
          </SheetTrigger>
          <AddGoalSheetContent
            formEmoji={formEmoji}
            setFormEmoji={setFormEmoji}
            formName={formName}
            setFormName={setFormName}
            formTarget={formTarget}
            setFormTarget={setFormTarget}
            formMonthly={formMonthly}
            setFormMonthly={setFormMonthly}
            formSaved={formSaved}
            setFormSaved={setFormSaved}
            saving={saving}
            onSubmit={submitNewGoal}
          />
        </Sheet>
      </div>

      {/* Primary */}
      <section className="relative mb-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <button
          type="button"
          className="absolute top-4 right-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive sm:top-6 sm:right-6"
          aria-label={`Delete ${primary.name}`}
          disabled={deletingId === primary.id}
          onClick={() => removeGoal(primary.id)}
        >
          <Trash2 className="size-4" />
        </button>
        <div className="flex flex-col gap-6 pr-10 sm:flex-row sm:items-start sm:pr-12">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-card text-[48px] leading-none ring-1 ring-border"
            aria-hidden
          >
            {primary.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-[20px] font-semibold text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              {primary.name}
            </h2>
            <p className="mt-2 min-h-[2.25rem] text-[28px] font-bold leading-tight text-penny-green sm:text-[32px]">
              {baseMonths === null ? (
                <span className="text-[17px] font-semibold leading-snug text-muted-foreground">
                  Add a monthly contribution to see how many months to go
                </span>
              ) : (
                monthsPhrase(baseMonths)
              )}
            </p>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {formatMoney(primaryNums!.saved, currency)} saved of{" "}
              {formatMoney(primaryNums!.target, currency)} target
            </p>

            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-[12px] text-muted-foreground">
                <span>Progress</span>
                <span className="tabular-nums">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-penny-green"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: [0, 0, 0.2, 1] }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-muted p-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                What-if monthly save
              </p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={SLIDER_MIN}
                  max={SLIDER_MAX}
                  step={SLIDER_STEP}
                  value={whatIfMonthly}
                  onChange={(e) =>
                    setWhatIfMonthly(Number.parseInt(e.target.value, 10))
                  }
                  className="h-2 flex-1 cursor-pointer accent-penny-green"
                  list="goal-whatif-marks"
                />
                <datalist id="goal-whatif-marks">
                  {sliderMarks.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
                <span className="w-24 shrink-0 text-right text-[13px] font-medium tabular-nums text-muted-foreground">
                  {formatMoney(whatIfMonthly, currency)}
                  /mo
                </span>
              </div>
              <p className="mt-3 min-h-[1.5rem] text-[14px] text-muted-foreground">
                <span className="text-muted-foreground">{primary.name} moves to </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={whatIfMonths ?? "x"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="inline font-semibold text-foreground"
                  >
                    {whatIfMonths === null
                      ? "—"
                      : whatIfMonths <= 0
                        ? "0 months away"
                        : `${whatIfMonths} month${whatIfMonths === 1 ? "" : "s"} away`}
                  </motion.span>
                </AnimatePresence>
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="saved-draft" className="text-[12px] text-muted-foreground">
                  Update saved amount
                </Label>
                <Input
                  id="saved-draft"
                  type="number"
                  min={0}
                  step="0.01"
                  value={savedDraft}
                  onChange={(e) => setSavedDraft(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <Button
                type="button"
                onClick={saveProgress}
                disabled={saving}
                className="sm:mb-0.5"
              >
                Save progress
              </Button>
            </div>
          </div>
        </div>
      </section>

      {secondary.length > 0 && (
        <>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Other goals
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {secondary.map((g) => {
              const { target, saved, monthly } = goalAmounts(g)
              const pct = progressPercent(target, saved)
              const m = monthsAway(target, saved, monthly)
              return (
                <li
                  key={g.id}
                  className="relative rounded-xl border border-border bg-surface-inset p-4 pr-10"
                >
                  <button
                    type="button"
                    className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    aria-label={`Delete ${g.name}`}
                    disabled={deletingId === g.id}
                    onClick={() => removeGoal(g.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <span className="text-[22px] leading-none" aria-hidden>
                      {g.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-muted-foreground">
                        {g.name}
                      </p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-border-strong"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[12px] text-muted-foreground">
                        {monthsPhrase(m)}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

function AddGoalSheetContent(props: {
  formEmoji: string
  setFormEmoji: (v: string) => void
  formName: string
  setFormName: (v: string) => void
  formTarget: string
  setFormTarget: (v: string) => void
  formMonthly: string
  setFormMonthly: (v: string) => void
  formSaved: string
  setFormSaved: (v: string) => void
  saving: boolean
  onSubmit: () => void
}) {
  const {
    formEmoji,
    setFormEmoji,
    formName,
    setFormName,
    formTarget,
    setFormTarget,
    formMonthly,
    setFormMonthly,
    formSaved,
    setFormSaved,
    saving,
    onSubmit,
  } = props

  return (
    <SheetContent className="overflow-y-auto">
      <SheetHeader>
        <SheetTitle>New goal</SheetTitle>
        <SheetDescription>
          Set a target and how much you plan to put aside each month.
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-2">
        <div>
          <Label className="mb-2 block">Emoji</Label>
          <div className="flex flex-wrap gap-2">
            {PICKER_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setFormEmoji(e)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl border text-[22px] transition-colors",
                  formEmoji === e
                    ? "border-penny-green bg-penny-green-muted"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="g-name">Name</Label>
          <Input
            id="g-name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Trip to Japan"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="g-target">Target amount</Label>
          <Input
            id="g-target"
            type="number"
            min={0}
            step="0.01"
            value={formTarget}
            onChange={(e) => setFormTarget(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="g-monthly">Monthly contribution</Label>
          <Input
            id="g-monthly"
            type="number"
            min={0}
            step="0.01"
            value={formMonthly}
            onChange={(e) => setFormMonthly(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="g-saved">Starting saved amount</Label>
          <Input
            id="g-saved"
            type="number"
            min={0}
            step="0.01"
            value={formSaved}
            onChange={(e) => setFormSaved(e.target.value)}
            className="mt-1.5"
          />
        </div>
      </div>
      <SheetFooter>
        <SheetClose
          render={<Button type="button" variant="outline" />}
        >
          Cancel
        </SheetClose>
        <Button type="button" disabled={saving} onClick={onSubmit}>
          {saving ? "Saving…" : "Save goal"}
        </Button>
      </SheetFooter>
    </SheetContent>
  )
}
