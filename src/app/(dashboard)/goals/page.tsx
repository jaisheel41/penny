import { redirect } from "next/navigation"

import { GoalsPageClient } from "@/components/goals/GoalsPageClient"
import { createClient } from "@/lib/supabase/server"

export default async function GoalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: goals }] = await Promise.all([
    supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle(),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true }),
  ])

  return (
    <GoalsPageClient
      initialGoals={goals ?? []}
      currency={profile?.currency ?? "GBP"}
    />
  )
}
