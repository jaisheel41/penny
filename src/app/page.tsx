import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  MessageSquareText,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Zap,
    title: "One-line quick add",
    description:
      'Type "Deliveroo £18" — we parse merchant, amount, and category. No chore.',
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: TrendingUp,
    title: "Month forecast",
    description:
      "See projected month-end spend from your pace so far, plus subscriptions.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: MessageSquareText,
    title: "Plain English pulse",
    description:
      "A short summary of what changed — not another spreadsheet.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" />
            </div>
            <span className="font-semibold tracking-tight">Penny</span>
          </div>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="size-[600px] rounded-full bg-primary/[0.08] blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-24 md:pb-28 md:pt-32">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <BarChart3 className="size-3.5" />
                Your money, spoken plainly
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Know where you&apos;re heading — not just where you&apos;ve been.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Log spending in one line, see your month in plain English, and get a
                forecast before the month ends.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "gap-2 shadow-lg shadow-primary/20"
                  )}
                >
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "gap-2"
                  )}
                >
                  Magic link sign-in
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-20">
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-xl",
                      f.bg
                    )}
                  >
                    <f.icon className={cn("size-5", f.color)} />
                  </div>
                  <h2 className="mt-4 font-semibold">{f.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Penny · Next.js · Supabase · Resend
      </footer>
    </div>
  )
}
