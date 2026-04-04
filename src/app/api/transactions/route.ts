import { NextResponse } from "next/server"

import { runPostTransactionNotifications } from "@/lib/notifications/after-transaction"
import { detectCategory } from "@/lib/utils/categories"
import { parseSpendLine } from "@/lib/utils/parser"
import { createClient } from "@/lib/supabase/server"
import type { SpendCategory } from "@/types"

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
  const category = searchParams.get("category")

  let q = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number)
    const start = `${month}-01`
    const end = new Date(y, m, 0)
    const endStr = `${month}-${String(end.getDate()).padStart(2, "0")}`
    q = q.gte("date", start).lte("date", endStr)
  }

  if (category) {
    q = q.eq("category", category)
  }

  const { data, error } = await q

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
  let merchant: string
  let amount: number
  let category: SpendCategory
  const note: string | null = body.note ?? null
  const dateStr: string =
    typeof body.date === "string" ? body.date : new Date().toISOString().slice(0, 10)

  if (typeof body.raw === "string" && body.raw.trim()) {
    const parsed = parseSpendLine(body.raw)
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse amount from line" },
        { status: 400 }
      )
    }
    merchant = parsed.merchant
    amount = parsed.amount
    category = detectCategory(merchant)
  } else if (body.merchant && body.amount != null) {
    merchant = String(body.merchant)
    amount = Number(body.amount)
    category = (body.category as SpendCategory) ?? detectCategory(merchant)
  } else {
    return NextResponse.json(
      { error: "Provide raw line or merchant + amount" },
      { status: 400 }
    )
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      merchant,
      amount,
      category,
      note,
      date: dateStr,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const {
    data: { user: fullUser },
  } = await supabase.auth.getUser()
  const email = fullUser?.email

  await runPostTransactionNotifications(supabase, user.id, email, {
    insertedCategory: category,
    referenceDate: new Date(dateStr + "T12:00:00"),
  })

  return NextResponse.json(data)
}
