import { redirect } from "next/navigation"

import { Toaster } from "sonner"

import { TopNav } from "@/components/layout/TopNav"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0c",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <TopNav email={user.email ?? ""} />
      <main style={{ minHeight: "calc(100vh - 3.75rem)" }}>
        {children}
        <Toaster richColors position="top-center" />
      </main>
    </div>
  )
}
