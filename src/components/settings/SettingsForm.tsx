"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Plus } from "lucide-react"

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
import { MOTION } from "@/lib/motion/presets"

// ── Grain SVG for hero card ─────────────────────────────────────────────────
const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

// ── Easing constant ──────────────────────────────────────────────────────────
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

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
  const reduceMotion = useReducedMotion()
  const r = reduceMotion === true

  const [name, setName] = useState(initial.name)
  const [currency, setCurrency] = useState(initial.currency)
  const [monthlyIncome, setMonthlyIncome] = useState(initial.monthly_income)
  const [emailNotifications, setEmailNotifications] = useState(
    initial.email_notifications
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null
  )

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
        setMessage({ text: "Changes saved.", ok: true })
        router.refresh()
      } else {
        const j = await res.json()
        setMessage({ text: j.error ?? "Failed to save", ok: false })
      }
    } finally {
      setLoading(false)
    }
  }

  const avatarLetter = (initial.name || email).charAt(0).toUpperCase()
  const displayName = initial.name || "Your account"

  // ── Motion variants ──────────────────────────────────────────────────────
  const sectionContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: r ? 0 : 0.09,
        delayChildren: r ? 0 : 0.25,
      },
    },
  }
  const sectionItem = {
    hidden: { opacity: 0, y: r ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: r ? 0 : 0.45, ease: MOTION.easeStandard },
    },
  }

  return (
    // ── Dark mode wrapper so all shadcn tokens resolve to dark values ────────
    <div
      className="dark"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >
      <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6 sm:py-8">

        {/* ── DARK HERO CARD ─────────────────────────────────────────────── */}
        <motion.div
          initial={r ? false : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: r ? 0 : 0.55, ease }}
          style={{
            position: "relative",
            borderRadius: "1.25rem",
            background: "#111110",
            border: "1px solid rgba(255,255,255,0.07)",
            overflow: "hidden",
            marginBottom: "1.25rem",
            padding: "clamp(1.5rem, 4vw, 2.25rem)",
          }}
        >
          {/* Grain texture */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: GRAIN,
              opacity: 0.45,
              zIndex: 0,
            }}
          />
          {/* Green glow — top right */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-40%",
              right: "-10%",
              width: "50%",
              height: "160%",
              background:
                "radial-gradient(ellipse at center, rgba(34,197,94,0.1) 0%, transparent 65%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          {/* Teal glow — bottom left */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: "-30%",
              left: "-5%",
              width: "40%",
              height: "110%",
              background:
                "radial-gradient(ellipse at center, rgba(13,148,136,0.07) 0%, transparent 65%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Hero content */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                textTransform: "uppercase",
                lineHeight: 0.92,
                marginBottom: "0.875rem",
              }}
            >
              <motion.span
                initial={r ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: r ? 0 : 0.1, ease }}
                style={{
                  display: "block",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  WebkitTextStroke: "1.5px rgba(240,239,233,0.4)",
                }}
              >
                Your
              </motion.span>
              <motion.span
                initial={r ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: r ? 0 : 0.2, ease }}
                style={{
                  display: "block",
                  color: "#22c55e",
                  WebkitTextFillColor: "#22c55e",
                  WebkitTextStroke: "0px",
                }}
              >
                Settings.
              </motion.span>
            </h1>
            <motion.p
              initial={r ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: r ? 0 : 0.35 }}
              style={{
                fontSize: "0.85rem",
                color: "rgba(240,239,233,0.38)",
                lineHeight: 1.5,
              }}
            >
              Manage your profile, currency, and notification preferences.
            </motion.p>
          </div>
        </motion.div>

        {/* ── GRID: account card + form card ─────────────────────────────── */}
        <motion.div
          variants={sectionContainer}
          initial="hidden"
          animate="show"
          className="grid gap-5 items-start lg:grid-cols-[280px_1fr]"
        >

          {/* ── ACCOUNT CARD ─────────────────────────────────────────────── */}
          <motion.div
            variants={sectionItem}
            className="lg:sticky lg:top-6"
            style={{
              position: "relative",
              borderRadius: "1.25rem",
              background: "#1a1a18",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "1.5rem",
              overflow: "hidden",
            }}
          >
            {/* Ambient green glow behind avatar */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: "-30%",
                left: "-15%",
                width: "65%",
                height: "55%",
                background:
                  "radial-gradient(ellipse at center, rgba(34,197,94,0.09) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Avatar */}
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "#4ade80",
                  background: "rgba(34,197,94,0.1)",
                  border: "2px solid rgba(34,197,94,0.3)",
                  boxShadow: "0 0 20px rgba(34,197,94,0.15)",
                  marginBottom: "1.125rem",
                  flexShrink: 0,
                }}
              >
                {avatarLetter}
              </div>

              {/* Name */}
              <p
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "#f0efe9",
                  letterSpacing: "-0.01em",
                }}
              >
                {displayName}
              </p>

              {/* Email */}
              <p
                style={{
                  marginTop: "0.25rem",
                  fontSize: "0.75rem",
                  color: "rgba(240,239,233,0.38)",
                  wordBreak: "break-all",
                  lineHeight: 1.5,
                }}
              >
                {email}
              </p>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.07)",
                  margin: "1.125rem 0",
                }}
              />

              {/* Privacy note */}
              <p
                style={{
                  fontSize: "0.75rem",
                  lineHeight: 1.65,
                  color: "rgba(240,239,233,0.28)",
                }}
              >
                Settings apply across all devices. Your data stays private and
                is never shared.
              </p>
            </div>
          </motion.div>

          {/* ── FORM CARD ────────────────────────────────────────────────── */}
          <motion.div
            variants={sectionItem}
            style={{
              borderRadius: "1.25rem",
              background: "#1a1a18",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "1.5rem",
            }}
          >
            <form onSubmit={onSubmit}>
              {/* Signed in as */}
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "rgba(240,239,233,0.32)",
                  marginBottom: "1.375rem",
                  lineHeight: 1.5,
                }}
              >
                Signed in as{" "}
                <span style={{ color: "#f0efe9", fontWeight: 500 }}>
                  {email}
                </span>
              </p>

              {/* ── NAME ─────────────────────────────────────────────────── */}
              <FieldRow
                label="Name"
                htmlFor="settings-name"
                hint={null}
              >
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#f0efe9",
                  }}
                />
              </FieldRow>

              <FieldDivider />

              {/* ── CURRENCY ─────────────────────────────────────────────── */}
              <FieldRow
                label="Currency"
                htmlFor="settings-currency"
                hint={null}
              >
                <Select
                  value={currency}
                  onValueChange={(v) => {
                    if (v) setCurrency(v)
                  }}
                >
                  <SelectTrigger
                    id="settings-currency"
                    className="w-full"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "#f0efe9",
                    }}
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  {/* dark class makes portal content use dark CSS tokens */}
                  <SelectContent className="dark max-h-64">
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
              </FieldRow>

              <FieldDivider />

              {/* ── MONTHLY INCOME ───────────────────────────────────────── */}
              <FieldRow
                label="Monthly income estimate"
                htmlFor="settings-income"
                hint="Used for overspend warnings and forecasts."
              >
                <Input
                  id="settings-income"
                  type="number"
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#f0efe9",
                  }}
                />
              </FieldRow>

              <FieldDivider />

              {/* ── EMAIL NOTIFICATIONS ──────────────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "1rem 1.125rem",
                  borderRadius: "0.875rem",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderLeft: `3px solid ${
                    emailNotifications
                      ? "rgba(34,197,94,0.55)"
                      : "rgba(255,255,255,0.08)"
                  }`,
                  transition: "border-left-color 0.3s ease",
                  margin: "1.25rem 0",
                }}
              >
                <div>
                  <Label
                    htmlFor="settings-notif"
                    style={{
                      color: "#f0efe9",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "block",
                    }}
                  >
                    Email notifications
                  </Label>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "rgba(240,239,233,0.35)",
                      marginTop: "0.15rem",
                    }}
                  >
                    Digests and budget alerts
                  </p>
                </div>
                <Switch
                  id="settings-notif"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              {/* ── STATUS MESSAGE ───────────────────────────────────────── */}
              {message && (
                <div
                  style={{
                    padding: "0.55rem 0.875rem",
                    borderRadius: "0.625rem",
                    background: message.ok
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(239,68,68,0.1)",
                    border: `1px solid ${
                      message.ok
                        ? "rgba(34,197,94,0.25)"
                        : "rgba(239,68,68,0.25)"
                    }`,
                    color: message.ok ? "#4ade80" : "#f87171",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    marginBottom: "0.875rem",
                  }}
                >
                  {message.text}
                </div>
              )}

              {/* ── SAVE BUTTON ──────────────────────────────────────────── */}
              <SaveButton loading={loading} />
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// ── Field row wrapper ─────────────────────────────────────────────────────────
function FieldRow({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint: string | null
  children: React.ReactNode
}) {
  return (
    <div style={{ padding: "1rem 0" }}>
      <Label
        htmlFor={htmlFor}
        style={{
          display: "block",
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "rgba(240,239,233,0.6)",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </Label>
      {children}
      {hint && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "rgba(240,239,233,0.3)",
            marginTop: "0.375rem",
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

// ── Field divider ─────────────────────────────────────────────────────────────
function FieldDivider() {
  return (
    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
  )
}

// ── Save button with hover state ──────────────────────────────────────────────
function SaveButton({ loading }: { loading: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "0.7rem",
        borderRadius: "9999px",
        fontSize: "0.875rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        cursor: loading ? "not-allowed" : "pointer",
        background: loading
          ? "rgba(34,197,94,0.08)"
          : hovered
          ? "rgba(34,197,94,0.22)"
          : "rgba(34,197,94,0.14)",
        border: loading
          ? "1px solid rgba(34,197,94,0.15)"
          : hovered
          ? "1px solid rgba(34,197,94,0.5)"
          : "1px solid rgba(34,197,94,0.28)",
        color: loading ? "rgba(74,222,128,0.45)" : "#4ade80",
        transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
      }}
    >
      {loading ? "Saving…" : "Save changes"}
    </button>
  )
}
