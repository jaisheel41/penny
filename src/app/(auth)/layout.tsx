export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-background to-primary/[0.04]" />
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <div className="size-[500px] rounded-full bg-primary/[0.06] blur-[100px]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
