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
    .from("networth_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("month", { ascending: true })

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
  const month = typeof body.month === "string" ? body.month.trim() : ""
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month (use YYYY-MM)" }, { status: 400 })
  }

  const savings = Number(body.savings ?? 0)
  const investments = Number(body.investments ?? 0)
  const pension = Number(body.pension ?? 0)
  const property_equity = Number(body.property_equity ?? 0)
  const total_debt = Number(body.total_debt ?? 0)
  const note =
    typeof body.note === "string" && body.note.trim()
      ? body.note.trim().slice(0, 2000)
      : null

  for (const [k, v] of Object.entries({
    savings,
    investments,
    pension,
    property_equity,
    total_debt,
  })) {
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: `Invalid ${k}` }, { status: 400 })
    }
  }

  const { data: existing } = await supabase
    .from("networth_snapshots")
    .select("id")
    .eq("user_id", user.id)
    .eq("month", month)
    .maybeSingle()

  const payload = {
    user_id: user.id,
    month,
    savings,
    investments,
    pension,
    property_equity,
    total_debt,
    note,
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from("networth_snapshots")
      .update({
        savings,
        investments,
        pension,
        property_equity,
        total_debt,
        note,
      })
      .eq("id", existing.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from("networth_snapshots")
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
