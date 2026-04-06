"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MailCheck } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ── Stagger variants ──────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get("error")
  const shouldReduceMotion = useReducedMotion()

  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    const supabase = createClient()
    const { error: signError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    setLoading(false)
    if (signError) {
      setErr(signError.message)
      return
    }
    setSent(true)
  }

  // ── Sent state ────────────────────────────────────────────────────────
  if (sent) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        style={{ textAlign: "center" }}
      >
        {/* Spring mail icon */}
        <motion.div
          initial={shouldReduceMotion ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 360, damping: 22, delay: 0.1 }}
          style={{
            width: "4.5rem",
            height: "4.5rem",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.75rem",
          }}
        >
          <MailCheck style={{ width: "1.75rem", height: "1.75rem", color: "#16a34a" }} />
        </motion.div>

        <motion.h2
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease }}
          style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#1c1917",
            marginBottom: "0.6rem",
          }}
        >
          Check your inbox
        </motion.h2>

        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.26, ease }}
          style={{
            fontSize: "0.9rem",
            color: "rgba(28,25,23,0.55)",
            lineHeight: 1.7,
            marginBottom: "2rem",
          }}
        >
          We sent a sign-in link to{" "}
          <strong style={{ color: "#1c1917", fontWeight: 600 }}>{email}</strong>.
          <br />
          It expires in 10 minutes.
        </motion.p>

        <motion.button
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          onClick={() => { setSent(false); setEmail("") }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.85rem",
            color: "#0d9488",
            fontWeight: 500,
            fontFamily: "var(--font-geist-sans)",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Try a different email
        </motion.button>
      </motion.div>
    )
  }

  // ── Login form ────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={container}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="show"
    >
      {/* Heading */}
      <motion.div variants={item} style={{ marginBottom: "2.25rem" }}>
        <h2
          style={{
            fontSize: "clamp(1.6rem,3vw,2rem)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "#1c1917",
            lineHeight: 1.1,
            marginBottom: "0.6rem",
          }}
        >
          Sign in to Penny
        </h2>
        <p
          style={{
            fontSize: "0.9rem",
            color: "rgba(28,25,23,0.52)",
            lineHeight: 1.65,
          }}
        >
          We&apos;ll email you a magic link —<br />no password needed.
        </p>
      </motion.div>

      {/* Error from URL */}
      {urlError === "auth" && (
        <motion.div
          variants={item}
          style={{
            marginBottom: "1.25rem",
            padding: "0.875rem 1rem",
            borderRadius: "0.75rem",
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.18)",
            fontSize: "0.85rem",
            color: "#dc2626",
          }}
        >
          Something went wrong signing you in. Please try again.
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit}>
        <motion.div variants={item} style={{ marginBottom: "1rem" }}>
          {/* Label */}
          <label
            htmlFor="email"
            style={{
              display: "block",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "rgba(28,25,23,0.5)",
              marginBottom: "0.55rem",
            }}
          >
            Email address
          </label>

          {/* Custom-styled input */}
          <div
            style={{
              position: "relative",
              borderRadius: "0.75rem",
              overflow: "hidden",
              boxShadow: focused
                ? "0 0 0 3px rgba(34,197,94,0.15)"
                : "0 1px 2px rgba(28,25,23,0.06)",
              transition: "box-shadow 0.2s ease",
            }}
          >
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                background: "#ffffff",
                border: `1.5px solid ${focused ? "#22c55e" : "#e4e0d8"}`,
                borderRadius: "0.75rem",
                padding: "0.875rem 1.125rem",
                fontSize: "0.95rem",
                color: "#1c1917",
                fontFamily: "var(--font-geist-sans)",
                outline: "none",
                transition: "border-color 0.2s ease",
                appearance: "none",
                WebkitAppearance: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </motion.div>

        {/* Inline error */}
        {err && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: "0.82rem",
              color: "#dc2626",
              marginBottom: "0.875rem",
              marginTop: "-0.25rem",
            }}
          >
            {err}
          </motion.p>
        )}

        {/* Submit button */}
        <motion.div variants={item} style={{ marginTop: "0.25rem" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.9375rem 1.5rem",
              borderRadius: "999px",
              background: loading ? "#86efac" : "#22c55e",
              color: "#0d0d0c",
              border: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              fontFamily: "var(--font-geist-sans)",
              letterSpacing: "-0.01em",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease",
              boxShadow: loading
                ? "none"
                : "rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.05) 0px 2px 4px, rgba(255,255,255,0.35) 0px 0.5px 0px 0px inset",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 6px 20px rgba(34,197,94,0.3)"
              }
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                "rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.05) 0px 2px 4px, rgba(255,255,255,0.35) 0px 0.5px 0px 0px inset"
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "1rem",
                    height: "1rem",
                    border: "2px solid rgba(13,13,12,0.25)",
                    borderTopColor: "#0d0d0c",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Sending…
              </>
            ) : (
              "Send magic link →"
            )}
          </button>
        </motion.div>
      </form>

      {/* Back link */}
      <motion.p
        variants={item}
        style={{
          marginTop: "1.75rem",
          textAlign: "center",
          fontSize: "0.82rem",
          color: "rgba(28,25,23,0.4)",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#0d9488",
            textDecoration: "none",
            fontWeight: 500,
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLAnchorElement).style.textDecoration = "underline")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLAnchorElement).style.textDecoration = "none")
          }
        >
          ← Back to home
        </Link>
      </motion.p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(28,25,23,0.3); }
      `}</style>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: "100%",
            height: "12rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "1.5rem",
              height: "1.5rem",
              border: "2px solid rgba(28,25,23,0.12)",
              borderTopColor: "#22c55e",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
