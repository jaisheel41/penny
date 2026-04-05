import { redirect } from "next/navigation"

import { SettingsForm } from "@/components/settings/SettingsForm"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, currency, monthly_income, email_notifications")
    .eq("id", user.id)
    .maybeSingle()

  const initial = {
    name: profile?.name ?? "",
    currency: profile?.currency ?? "GBP",
    monthly_income: profile?.monthly_income?.toString() ?? "",
    email_notifications: profile?.email_notifications ?? true,
  }

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-tight text-2xl text-foreground sm:text-[24px]">
          Settings
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-[14px]">
          Manage your profile, currency, and notification preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Account card */}
        <div className="self-start rounded-2xl border border-border bg-card p-6 shadow-elevation-sm">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-penny-green-muted text-[20px] font-semibold text-penny-green">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <p className="text-[15px] font-semibold text-foreground">
            {profile?.name || "Your account"}
          </p>
          <p className="mt-0.5 break-all text-[13px] text-muted-foreground">
            {user.email}
          </p>
          <div className="mt-4 h-px bg-border" />
          <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
            Settings apply across all devices. Your data stays private and is
            never shared.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-sm">
          <SettingsForm email={user.email ?? ""} initial={initial} />
        </div>
      </div>
    </div>
  )
}
