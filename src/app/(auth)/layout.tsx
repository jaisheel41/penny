import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Brand panel — large screens */}
      <aside className="relative hidden w-full max-w-xl shrink-0 flex-col justify-between overflow-hidden border-border bg-surface-inset lg:flex lg:border-r">
        <div className="pointer-events-none absolute inset-0 bg-paper-noise" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 size-[420px] rounded-full bg-penny-green/10 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 size-[320px] rounded-full bg-penny-teal/10 blur-[90px]"
        />
        <div className="relative z-10 flex flex-1 flex-col justify-center px-10 py-16 xl:px-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-penny-green text-sm font-bold text-white shadow-elevation-sm">
              P
            </span>
            Penny
          </Link>
          <h1 className="mt-10 text-3xl font-semibold leading-tight tracking-tight text-foreground xl:text-[2.25rem]">
            Your spending, explained—without spreadsheet guilt.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Log expenses in plain English, see patterns at a glance, and stay on track with a calm,
            intentional dashboard built for real life.
          </p>
        </div>
        <footer className="relative z-10 border-t border-border-subtle px-10 py-6 text-xs leading-relaxed text-muted-foreground xl:px-16">
          <p>
            Magic links only—no password stored on our servers. By continuing you agree to use Penny
            responsibly.{" "}
            <Link
              href="/"
              className="font-medium text-penny-teal underline-offset-4 hover:underline"
            >
              Home
            </Link>
          </p>
        </footer>
      </aside>

      {/* Form column */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 size-[min(100vw,400px)] rounded-full bg-penny-green/[0.07] blur-[80px]" />
          <div className="absolute -bottom-24 left-0 size-[min(90vw,360px)] rounded-full bg-penny-amber/[0.06] blur-[90px]" />
          <div className="bg-paper-noise absolute inset-0 opacity-50" aria-hidden />
        </div>
        <div className="relative z-10 w-full max-w-md">{children}</div>
        <footer className="relative z-10 mt-10 max-w-md text-center text-xs leading-relaxed text-muted-foreground lg:hidden">
          <p>
            Magic-link sign-in.{" "}
            <Link href="/" className="font-medium text-penny-teal underline-offset-4 hover:underline">
              Back to home
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
