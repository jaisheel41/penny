"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"

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
import { createClient } from "@/lib/supabase/client"

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
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
    <Card className="w-full max-w-md border border-white/20 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-xl">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Sparkles className="size-5" />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Sign in to Penny
        </CardTitle>
        <CardDescription>
          We&apos;ll email you a magic link. No password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error === "auth" && (
          <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            Something went wrong signing you in. Try again.
          </p>
        )}
        {sent ? (
          <div className="rounded-lg bg-emerald-500/10 p-4 text-center text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              Check your inbox
            </p>
            <p className="mt-1 text-muted-foreground">
              We sent a sign-in link to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-background/50"
              />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button
              type="submit"
              className="w-full shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Back to home
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md p-8">Loading…</Card>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
