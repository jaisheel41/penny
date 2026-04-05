"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MailCheck, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MOTION } from "@/lib/motion/presets"
import { createClient } from "@/lib/supabase/client"

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const reduceMotion = useReducedMotion()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

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

  return (
    <>
      <div className="mb-8 text-center lg:hidden">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-penny-green text-white shadow-elevation-sm">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <p className="text-lg font-semibold tracking-tight text-foreground">Sign in to Penny</p>
        <p className="mt-1 text-sm text-muted-foreground">We&apos;ll email you a magic link.</p>
      </div>

      <Card className="w-full border-border shadow-elevation-md">
        <CardHeader className="hidden space-y-2 text-center lg:block lg:pt-8">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-penny-green text-white shadow-elevation-sm">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-2xl tracking-tight">Sign in to Penny</CardTitle>
          <CardDescription className="text-pretty">
            We&apos;ll email you a magic link — no password needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error === "auth" && (
            <p className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              Something went wrong signing you in. Try again.
            </p>
          )}
          {sent ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: MOTION.base,
                ease: MOTION.easeStandard,
              }}
              className="rounded-xl border border-penny-green/25 bg-penny-green-muted p-6 text-center"
            >
              <motion.div
                className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-card text-penny-green shadow-elevation-sm"
                initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 22,
                  delay: reduceMotion ? 0 : 0.05,
                }}
              >
                <MailCheck className="size-7" aria-hidden />
              </motion.div>
              <p className="font-semibold text-penny-green">Check your inbox</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We sent a sign-in link to <strong className="text-foreground">{email}</strong>.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button
                type="submit"
                variant="success"
                size="lg"
                className="w-full shadow-elevation-sm transition-shadow hover:shadow-elevation-md"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="font-medium text-penny-teal underline-offset-4 hover:underline"
            >
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md border-border p-8 shadow-elevation-sm">
          Loading…
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
