import { redirect } from "next/navigation"

import { Header } from "@/components/layout/Header"
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, currency, monthly_income, email_notifications")
    .eq("id", user.id)
    .maybeSingle()

  const profileSettings = {
    name: profile?.name ?? "",
    currency: profile?.currency ?? "GBP",
    monthly_income: profile?.monthly_income?.toString() ?? "",
    email_notifications: profile?.email_notifications ?? true,
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header email={user.email ?? ""} profileSettings={profileSettings} />
        <main
          className="flex-1 p-4 md:p-6 lg:p-8"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(0.75 0.03 264 / 0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
