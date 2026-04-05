import { redirect } from "next/navigation"

import { NetWorthTimelineClient } from "@/components/networth/NetWorthTimelineClient"
import { createClient } from "@/lib/supabase/server"

export default async function NetworthPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: snapshots }] = await Promise.all([
    supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle(),
    supabase
      .from("networth_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .order("month", { ascending: true }),
  ])

  return (
    <NetWorthTimelineClient
      initialSnapshots={snapshots ?? []}
      currency={profile?.currency ?? "GBP"}
    />
  )
}
