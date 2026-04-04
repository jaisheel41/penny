import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")

  let q = supabase.from("budgets").select("*").eq("user_id", user.id)

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    q = q.eq("month", month)
  }

  const { data, error } = await q.order("category")

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
  const category = String(body.category ?? "").trim()
  const monthly_limit = Number(body.monthly_limit)
  const month = String(body.month ?? "").trim()

  if (!category || !month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "category and month (YYYY-MM) required" }, { status: 400 })
  }
  if (!Number.isFinite(monthly_limit) || monthly_limit <= 0) {
    return NextResponse.json({ error: "Invalid monthly_limit" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id)
    .eq("month", month)
    .eq("category", category)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from("budgets")
      .update({ monthly_limit })
      .eq("id", existing.id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: user.id,
      category,
      monthly_limit,
      month,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
