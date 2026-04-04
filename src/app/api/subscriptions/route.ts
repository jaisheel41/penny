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
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
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
  const name = String(body.name ?? "").trim()
  const amount = Number(body.amount)
  const renewal_day = Number(body.renewal_day)
  if (!name || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid name or amount" }, { status: 400 })
  }
  if (!Number.isInteger(renewal_day) || renewal_day < 1 || renewal_day > 31) {
    return NextResponse.json({ error: "renewal_day must be 1–31" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      name,
      amount,
      renewal_day,
      category: body.category ?? "subscriptions",
      active: body.active !== false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
