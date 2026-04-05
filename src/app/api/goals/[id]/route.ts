import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  if (body.saved_amount == null) {
    return NextResponse.json(
      { error: "saved_amount is required" },
      { status: 400 }
    )
  }
  const saved_amount = Number(body.saved_amount)
  if (!Number.isFinite(saved_amount) || saved_amount < 0) {
    return NextResponse.json({ error: "Invalid saved_amount" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("goals")
    .update({ saved_amount })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
