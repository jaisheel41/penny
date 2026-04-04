import { MessageSquareText } from "lucide-react"

export function MonthlyPulse({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-violet-500/5 via-background to-violet-500/[0.02] p-5 shadow-sm">
      <div className="absolute -right-6 -top-6 size-20 rounded-full bg-violet-500/8 blur-2xl" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 dark:bg-violet-400/10">
            <MessageSquareText className="size-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold">Monthly pulse</h3>
        </div>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  )
}
