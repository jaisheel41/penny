import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const emoji =
    typeof body.emoji === "string" && body.emoji.trim()
      ? body.emoji.trim().slice(0, 8)
      : "🎯"
  const target_amount = Number(body.target_amount)
  const monthly_contribution = Number(body.monthly_contribution)
  const saved_amount =
    body.saved_amount != null ? Number(body.saved_amount) : 0

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  if (!Number.isFinite(target_amount) || target_amount <= 0) {
    return NextResponse.json({ error: "Invalid target amount" }, { status: 400 })
  }
  if (!Number.isFinite(monthly_contribution) || monthly_contribution < 0) {
    return NextResponse.json(
      { error: "Invalid monthly contribution" },
      { status: 400 }
    )
  }
  if (!Number.isFinite(saved_amount) || saved_amount < 0) {
    return NextResponse.json({ error: "Invalid starting saved amount" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("goals")
    .select("priority")
    .eq("user_id", user.id)

  const nextPriority =
    (existing?.length ?? 0) > 0
      ? Math.max(...existing!.map((r) => r.priority)) + 1
      : 1

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      name,
      emoji,
      target_amount,
      monthly_contribution,
      saved_amount,
      priority: nextPriority,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
