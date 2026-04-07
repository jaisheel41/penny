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
    <SettingsForm email={user.email ?? ""} initial={initial} />
  )
}
