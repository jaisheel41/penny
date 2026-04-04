import type { SpendCategory } from "@/types"

const RULES: { category: SpendCategory; patterns: RegExp[] }[] = [
  {
    category: "rent",
    patterns: [/rent/i, /landlord/i, /zoopla/i, /rightmove/i, /mortgage/i],
  },
  {
    category: "food",
    patterns: [
      /deliveroo/i,
      /uber\s*eats/i,
      /just\s*eat/i,
      /tesco/i,
      /sainsbury/i,
      /asda/i,
      /aldi/i,
      /lidl/i,
      /waitrose/i,
      /m&s/i,
      /marks\s*&\s*spencer/i,
      /pret/i,
      /cafe/i,
      /coffee/i,
      /restaurant/i,
      /mcdonald/i,
      /nandos/i,
    ],
  },
  {
    category: "travel",
    patterns: [
      /uber(?!.*eats)/i,
      /lyft/i,
      /trainline/i,
      /tfl/i,
      /oyster/i,
      /shell/i,
      /bp\s/i,
      /esso/i,
      /parking/i,
    ],
  },
  {
    category: "subscriptions",
    patterns: [
      /netflix/i,
      /spotify/i,
      /apple\s*one/i,
      /amazon\s*prime/i,
      /disney/i,
      /github/i,
      /notion/i,
      /dropbox/i,
      /adobe/i,
      /microsoft\s*365/i,
    ],
  },
  {
    category: "clothes",
    patterns: [/uniqlo/i, /zara/i, /h&m/i, /nike/i, /asos/i, /primark/i],
  },
  {
    category: "entertainment",
    patterns: [/cinema/i, /theatre/i, /ticketmaster/i, /eventbrite/i, /steam/i],
  },
]

export function detectCategory(merchant: string): SpendCategory {
  const m = merchant.trim()
  for (const { category, patterns } of RULES) {
    for (const re of patterns) {
      if (re.test(m)) return category
    }
  }
  return "misc"
}
