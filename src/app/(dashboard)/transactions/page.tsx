import { redirect } from "next/navigation"

interface Props {
  searchParams: Promise<{ month?: string; category?: string }>
}

export default async function TransactionsRedirect({ searchParams }: Props) {
  const sp = await searchParams
  const params = new URLSearchParams({ tab: "transactions" })
  if (sp.month) params.set("month", sp.month)
  if (sp.category) params.set("category", sp.category)
  redirect(`/manage?${params.toString()}`)
}
