"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { Plus, Trash2, X, Target } from "lucide-react"

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

// ── Constants ────────────────────────────────────────────────────────────────
const SLIDER_MIN = 50
const SLIDER_MAX = 1000
const SLIDER_STEP = 25
const PICKER_EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💍", "🎓", "🏖️", "💻", "🐶", "🌴"]

function clampStep(v: number) {
  return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Math.round(v / SLIDER_STEP) * SLIDER_STEP))
}
function monthsPhrase(m: number | null) {
  if (m === null) return "—"
  if (m <= 0) return "0 months away"
  return `${m} month${m === 1 ? "" : "s"} away`
}

// ── Shared styles ────────────────────────────────────────────────────────────
const darkInput: React.CSSProperties = {
  height: "2.25rem",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  padding: "0 0.75rem",
  fontSize: "0.875rem",
  color: "#f0efe9",
  outline: "none",
  fontFamily: "var(--font-geist-sans)",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  width: "100%",
  boxSizing: "border-box" as const,
}
const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "rgba(240,239,233,0.38)",
  marginBottom: "0.4rem",
}

// ── Circular progress ring ───────────────────────────────────────────────────
function ProgressRing({ pct, size = 72 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={4}
      />
      {/* Fill */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#22c55e"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      />
    </svg>
  )
}

// ── Individual goal card ─────────────────────────────────────────────────────
function GoalCard({
  goal,
  currency,
  onDelete,
  onUpdate,
  deleting,
}: {
  goal: Goal
  currency: string
  onDelete: (id: string) => void
  onUpdate: (before: Goal, updated: Goal) => void
  deleting: boolean
}) {
  const { target, saved, monthly } = goalAmounts(goal)
  const pct = progressPercent(target, saved)
  const baseMonths = monthsAway(target, saved, monthly)

  const [whatIfMonthly, setWhatIfMonthly] = useState(() =>
    clampStep(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, monthly > 0 ? monthly : SLIDER_MIN)))
  )
  const whatIfMonths = monthsAway(target, saved, whatIfMonthly)

  const [savedDraft, setSavedDraft] = useState(saved.toString())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSavedDraft(saved.toString())
  }, [goal.id, saved])

  useEffect(() => {
    const m = monthly > 0 ? monthly : SLIDER_MIN
    setWhatIfMonthly(clampStep(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, m))))
  }, [goal.id, monthly])

  const sliderMarks = useMemo(() => {
    const m: number[] = []
    for (let v = SLIDER_MIN; v <= SLIDER_MAX; v += SLIDER_STEP) m.push(v)
    return m
  }, [])

  async function handleSave() {
    const nextSaved = Number.parseFloat(savedDraft)
    if (!Number.isFinite(nextSaved) || nextSaved < 0) {
      toast.error("Invalid amount")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
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
      onUpdate(goal, updated)
      toast.success("Progress saved")
    } finally {
      setSaving(false)
    }
  }

  const isComplete = pct >= 100

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: isComplete
          ? "1px solid rgba(34,197,94,0.28)"
          : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1rem",
        padding: "1.375rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.125rem",
        position: "relative",
        WebkitFontSmoothing: "antialiased",
        transition: "border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!isComplete)
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.14)"
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = isComplete
          ? "rgba(34,197,94,0.28)"
          : "rgba(255,255,255,0.08)"
      }}
    >
      {/* ── Top row: emoji + name + delete ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
          <span
            style={{
              width: "2.75rem",
              height: "2.75rem",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.375rem",
              borderRadius: "0.625rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
            aria-hidden
          >
            {goal.emoji}
          </span>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#f0efe9",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}
            >
              {goal.name}
            </p>
            {isComplete && (
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#22c55e",
                }}
              >
                Complete ✓
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label={`Delete ${goal.name}`}
          disabled={deleting}
          onClick={() => onDelete(goal.id)}
          style={{
            flexShrink: 0,
            width: "1.875rem",
            height: "1.875rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "0.4rem",
            border: "none",
            background: "transparent",
            cursor: deleting ? "not-allowed" : "pointer",
            color: "rgba(240,239,233,0.28)",
            opacity: deleting ? 0.5 : 1,
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = "rgba(248,113,113,0.1)"
            el.style.color = "#f87171"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = "transparent"
            el.style.color = "rgba(240,239,233,0.28)"
          }}
        >
          <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
        </button>
      </div>

      {/* ── Progress ring + months ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProgressRing pct={pct} size={68} />
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#22c55e",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pct.toFixed(0)}%
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: "1.375rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: baseMonths === null ? "rgba(240,239,233,0.38)" : "#f0efe9",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {baseMonths === null ? "—" : monthsPhrase(baseMonths)}
          </p>
          <p style={{ marginTop: "0.25rem", fontSize: "0.78rem", color: "rgba(240,239,233,0.35)", fontVariantNumeric: "tabular-nums" }}>
            {formatMoney(saved, currency)} of {formatMoney(target, currency)}
          </p>
        </div>
      </div>

      {/* ── What-if slider ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "0.625rem",
          padding: "0.875rem",
        }}
      >
        <p
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(240,239,233,0.3)",
            marginBottom: "0.625rem",
          }}
        >
          What-if monthly save
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            value={whatIfMonthly}
            onChange={(e) => setWhatIfMonthly(Number.parseInt(e.target.value, 10))}
            list={`marks-${goal.id}`}
            style={{ flex: 1, cursor: "pointer", accentColor: "#22c55e" }}
          />
          <datalist id={`marks-${goal.id}`}>
            {sliderMarks.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <span
            style={{
              flexShrink: 0,
              width: "5.5rem",
              textAlign: "right",
              fontSize: "0.78rem",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: "#22c55e",
            }}
          >
            {formatMoney(whatIfMonthly, currency)}/mo
          </span>
        </div>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.78rem",
            color: "rgba(240,239,233,0.35)",
            minHeight: "1.25rem",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={whatIfMonths ?? "x"}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18 }}
              style={{ display: "inline" }}
            >
              {whatIfMonths === null ? "Add target to see estimate" : (
                <>
                  <span style={{ color: "rgba(240,239,233,0.42)" }}>→ </span>
                  <span style={{ color: "#f0efe9", fontWeight: 600 }}>
                    {whatIfMonths <= 0 ? "Already there!" : `${monthsPhrase(whatIfMonths)}`}
                  </span>
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>

      {/* ── Update saved amount ── */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor={`saved-${goal.id}`} style={fieldLabel}>
            Update saved
          </label>
          <input
            id={`saved-${goal.id}`}
            type="number"
            min={0}
            step="0.01"
            value={savedDraft}
            onChange={(e) => setSavedDraft(e.target.value)}
            style={darkInput}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "rgba(34,197,94,0.5)"
              ;(e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(34,197,94,0.08)"
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"
              ;(e.target as HTMLInputElement).style.boxShadow = "none"
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            height: "2.25rem",
            padding: "0 1rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#22c55e",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#0d0d0c",
            fontFamily: "var(--font-geist-sans)",
            opacity: saving ? 0.6 : 1,
            flexShrink: 0,
            transition: "opacity 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </motion.div>
  )
}

// ── Add goal dark modal ──────────────────────────────────────────────────────
function AddGoalModal({
  open,
  onClose,
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
}: {
  open: boolean
  onClose: () => void
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
  const [focused, setFocused] = useState<string | null>(null)

  function iStyle(field: string): React.CSSProperties {
    return focused === field
      ? { ...darkInput, borderColor: "rgba(34,197,94,0.5)", boxShadow: "0 0 0 3px rgba(34,197,94,0.08)" }
      : darkInput
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 101,
              width: "min(30rem, calc(100vw - 2rem))",
              maxHeight: "calc(100svh - 4rem)",
              overflowY: "auto",
              background: "#111110",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#f0efe9" }}>
                  New goal
                </h2>
                <p style={{ marginTop: "0.2rem", fontSize: "0.78rem", color: "rgba(240,239,233,0.38)" }}>
                  Set a target and how much to put aside each month.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "1.875rem",
                  height: "1.875rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  color: "rgba(240,239,233,0.5)",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.12)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)" }}
              >
                <X style={{ width: "0.875rem", height: "0.875rem" }} />
              </button>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Emoji picker */}
              <div>
                <label style={fieldLabel}>Emoji</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {PICKER_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setFormEmoji(e)}
                      style={{
                        width: "2.75rem",
                        height: "2.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "0.625rem",
                        fontSize: "1.375rem",
                        border: formEmoji === e
                          ? "1px solid rgba(34,197,94,0.5)"
                          : "1px solid rgba(255,255,255,0.1)",
                        background: formEmoji === e
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        transition: "border-color 0.15s ease, background 0.15s ease",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="g-name" style={fieldLabel}>Name</label>
                <input
                  id="g-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Trip to Japan"
                  style={iStyle("name")}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                />
              </div>

              <div>
                <label htmlFor="g-target" style={fieldLabel}>Target amount</label>
                <input
                  id="g-target"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder="5000"
                  style={iStyle("target")}
                  onFocus={() => setFocused("target")}
                  onBlur={() => setFocused(null)}
                />
              </div>

              <div>
                <label htmlFor="g-monthly" style={fieldLabel}>Monthly contribution</label>
                <input
                  id="g-monthly"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formMonthly}
                  onChange={(e) => setFormMonthly(e.target.value)}
                  placeholder="200"
                  style={iStyle("monthly")}
                  onFocus={() => setFocused("monthly")}
                  onBlur={() => setFocused(null)}
                />
              </div>

              <div>
                <label htmlFor="g-saved" style={fieldLabel}>Already saved</label>
                <input
                  id="g-saved"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formSaved}
                  onChange={(e) => setFormSaved(e.target.value)}
                  placeholder="0"
                  style={iStyle("saved")}
                  onFocus={() => setFocused("saved")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "0.5625rem 1.125rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "rgba(240,239,233,0.55)",
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onSubmit}
                style={{
                  padding: "0.5625rem 1.375rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "#22c55e",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#0d0d0c",
                  fontFamily: "var(--font-geist-sans)",
                  opacity: saving ? 0.6 : 1,
                  transition: "opacity 0.15s ease",
                }}
              >
                {saving ? "Saving…" : "Save goal"}
              </button>
            </div>

            <style>{`
              input::placeholder { color: rgba(240,239,233,0.22) !important; }
              input[type="number"]::-webkit-inner-spin-button,
              input[type="number"]::-webkit-outer-spin-button { opacity: 0.3; }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Page client ──────────────────────────────────────────────────────────────
export function GoalsPageClient(props: {
  initialGoals: Goal[]
  currency: string
}) {
  const { currency } = props
  const [goals, setGoals] = useState<Goal[]>(props.initialGoals)
  const [modalOpen, setModalOpen] = useState(false)
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
      setModalOpen(false)
      await refreshGoals()
      toast.success("Goal added")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = (before: Goal, updated: Goal) => {
    const { target: t } = goalAmounts(before)
    const { saved: s0 } = goalAmounts(before)
    const { saved: s1 } = goalAmounts(updated)
    if (t > 0) {
      const oldPct = progressPercent(t, s0)
      const newPct = progressPercent(t, s1)
      const state = readMilestoneState()
      const prev = Math.max(state[updated.id] ?? 0, highestMilestonePct(oldPct))
      const next = highestMilestonePct(newPct)
      if (next > prev && next >= 25) {
        const crossed = next as 25 | 50 | 75 | 100
        celebrateMilestone(crossed)
        toast.success(milestoneToastMessage(updated.name, crossed))
        state[updated.id] = crossed
        writeMilestoneState(state)
      }
    }
    setGoals((g) => g.map((x) => (x.id === updated.id ? updated : x)))
  }

  const removeGoal = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Could not remove goal"); return }
      await refreshGoals()
      toast.success("Goal removed")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >
      {/* ── Outlined header card ──────────────────────────────── */}
      <div
        style={{
          background: "#111110",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1.25rem",
          padding: "clamp(1.5rem, 4vw, 2rem)",
          marginBottom: "1.5rem",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1.25rem",
          flexWrap: "wrap",
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
        {/* Glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-50%",
            left: "-10%",
            width: "50%",
            height: "200%",
            background: "radial-gradient(ellipse at center, rgba(34,197,94,0.09) 0%, transparent 65%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              lineHeight: 0.9,
              marginBottom: "0.875rem",
            }}
          >
            <span
              style={{
                display: "block",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                WebkitTextStroke: "1.5px rgba(240,239,233,0.45)",
              }}
            >
              Your goals,
            </span>
            <span
              style={{
                display: "block",
                color: "#22c55e",
                WebkitTextFillColor: "#22c55e",
                WebkitTextStroke: "0px",
              }}
            >
              Targets.
            </span>
          </h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(240,239,233,0.38)", lineHeight: 1.55 }}>
            Save toward what matters — one milestone at a time.
          </p>
        </div>

        {/* Add goal button */}
        <motion.button
          type="button"
          onClick={() => { resetForm(); setModalOpen(true) }}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.97 }}
          style={{
            position: "relative",
            zIndex: 1,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.6875rem 1.375rem",
            borderRadius: "9999px",
            border: "none",
            background: "#22c55e",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "#0d0d0c",
            fontFamily: "var(--font-geist-sans)",
            flexShrink: 0,
            boxShadow: "rgba(0,0,0,0.3) 0px 2px 4px, rgba(34,197,94,0.3) 0px 4px 18px",
          }}
        >
          <Plus style={{ width: "0.9rem", height: "0.9rem" }} />
          Add goal
        </motion.button>
      </div>

      {/* ── Empty state ───────────────────────────────────────── */}
      {goals.length === 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "50%",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <Target style={{ width: "1.375rem", height: "1.375rem", color: "#22c55e" }} />
          </div>
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f0efe9", marginBottom: "0.375rem" }}>
            No goals yet
          </p>
          <p style={{ fontSize: "0.825rem", color: "rgba(240,239,233,0.38)" }}>
            Add your first goal to track progress and see monthly estimates.
          </p>
        </div>
      )}

      {/* ── Goals grid — all equal size ───────────────────────── */}
      {goals.length > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                currency={currency}
                onDelete={removeGoal}
                onUpdate={handleUpdate}
                deleting={deletingId === g.id}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Add goal modal ────────────────────────────────────── */}
      <AddGoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
    </div>
  )
}
