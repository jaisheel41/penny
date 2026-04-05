import { redirect } from "next/navigation"

import { Toaster } from "sonner"

import { Sidebar } from "@/components/layout/Sidebar"
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar email={user.email ?? ""} />
      <main className="h-screen flex-1 overflow-y-auto pb-16 transition-colors duration-[var(--motion-base)] md:pb-0">
        {children}
        <Toaster richColors position="top-center" />
      </main>
    </div>
  )
}
