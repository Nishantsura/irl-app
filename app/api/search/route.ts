import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

const BLOCKED_SOURCES = new Set([
  "meesho", "shopclues", "paytm mall", "paytmmall", "jiomart",
])

const BLOCKED_DOMAINS = ["meesho.com", "shopclues.com", "paytmmall.com", "jiomart.com"]

const FEMALE_INDICATORS = /\b(men'?s|for men|boys?|gents|male)\b/i
const MALE_INDICATORS = /\b(women'?s|for women|girls?|ladies|female|saree|lehenga|kurti)\b/i

interface SerperProduct {
  title?: string
  price?: string
  source?: string
  link?: string
  imageUrl?: string
  rating?: number
  ratingCount?: number
}

interface ParsedProduct {
  title: string
  price: number
  priceFormatted: string
  brand: string
  rating: number
  reviewCount: number
  imageUrl: string
  link: string
  source: string
}

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0
  const cleaned = priceStr.replace(/[₹$€£,\s]/g, "")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`
}

function isBlockedSource(source: string, link: string): boolean {
  const sourceLower = source.toLowerCase().trim()
  if (BLOCKED_SOURCES.has(sourceLower)) return true
  const linkLower = link.toLowerCase()
  return BLOCKED_DOMAINS.some((d) => linkLower.includes(d))
}

function isWrongGender(title: string, gender: string): boolean {
  if (gender === "women") return FEMALE_INDICATORS.test(title)
  if (gender === "men") return MALE_INDICATORS.test(title)
  return false
}

function buildGenderQuery(query: string, gender: string): string {
  if (gender === "women") return `${query} -men -boys -gents`
  if (gender === "men") return `${query} -women -girls -ladies`
  return query
}

function parseSerperResults(items: SerperProduct[]): ParsedProduct[] {
  return items
    .map((item) => {
      const price = parsePrice(item.price || "0")
      return {
        title: item.title || "Product",
        price,
        priceFormatted: price > 0 ? formatPrice(price) : item.price || "Price unavailable",
        brand: item.source || "Online Store",
        rating: item.rating || 0,
        reviewCount: item.ratingCount || 0,
        imageUrl: item.imageUrl || "",
        link: item.link || "#",
        source: item.source || "Store",
      }
    })
    .filter((p) => p.price > 0)
}

async function searchSerper(query: string): Promise<SerperProduct[]> {
  const response = await fetch("https://google.serper.dev/shopping", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, gl: "in", hl: "en", num: 20 }),
  })
  if (!response.ok) return []
  const data = await response.json()
  return data.shopping || []
}

function filterProducts(products: ParsedProduct[], gender: string): ParsedProduct[] {
  return products.filter((p) => {
    if (isBlockedSource(p.source, p.link)) return false
    if (isWrongGender(p.title, gender)) return false
    return true
  })
}

function deduplicateByLink(products: ParsedProduct[]): ParsedProduct[] {
  const seen = new Set<string>()
  return products.filter((p) => {
    if (seen.has(p.link)) return false
    seen.add(p.link)
    return true
  })
}

const STOP_WORDS = new Set(["in", "for", "and", "the", "a", "an", "of", "with", "india", "women", "men", "boys", "girls", "branded"])

function naiveFallbackSort(products: ParsedProduct[], query: string): ParsedProduct[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))

  return [...products].sort((a, b) => {
    const aTitle = a.title.toLowerCase()
    const bTitle = b.title.toLowerCase()
    const aMatch = terms.length > 0 ? terms.filter((t) => aTitle.includes(t)).length / terms.length : 0
    const bMatch = terms.length > 0 ? terms.filter((t) => bTitle.includes(t)).length / terms.length : 0
    if (bMatch !== aMatch) return bMatch - aMatch
    if (b.rating !== a.rating) return b.rating - a.rating
    return 0
  })
}

async function rerankWithAI(
  candidates: ParsedProduct[],
  description: string,
  category: string,
  gender: string
): Promise<ParsedProduct[]> {
  if (candidates.length <= 2) return candidates

  const numbered = candidates
    .slice(0, 15)
    .map((p, i) => `${i + 1}. "${p.title}" — ${p.source} — ${p.priceFormatted}`)
    .join("\n")

  const prompt = `You are a fashion product relevance ranker for Indian e-commerce.

ORIGINAL ITEM DESCRIPTION:
"${description}"

CATEGORY: ${category}
GENDER: ${gender}

CANDIDATE PRODUCTS (numbered):
${numbered}

Rank these products by how well they match the original item description.

RANKING CRITERIA (in priority order):
1. Visual similarity to the described item (color, style, fit, fabric, pattern)
2. Brand quality — prefer established brands and retailers (H&M, Zara, Mango, AND, W, Biba, Levi's, Nike, Adidas, Puma, Myntra exclusives, Ajio exclusives, Amazon brands, Tata CLiQ, Nykaa Fashion) over unbranded/generic
3. Price-value mix — rank so the final list has a MIX of premium and affordable options, not all cheap or all expensive
4. Correct gender match — ${gender} clothing only

Return ONLY a JSON array of product numbers in ranked order, best match first.
Example: [3, 1, 5, 2, 4]`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })
    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const ranked: number[] = JSON.parse(text)

    if (!Array.isArray(ranked) || ranked.length === 0) return candidates

    const reordered: ParsedProduct[] = []
    const used = new Set<number>()
    for (const idx of ranked) {
      const i = idx - 1
      if (i >= 0 && i < candidates.length && !used.has(i)) {
        reordered.push(candidates[i])
        used.add(i)
      }
    }
    // Append any candidates the model missed
    candidates.forEach((p, i) => {
      if (!used.has(i)) reordered.push(p)
    })
    return reordered
  } catch (err) {
    console.error("Rerank failed, using fallback sort:", err)
    return candidates
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      searchQueries = [],
      gender = "unknown",
      description = "",
      category = "",
    } = body as {
      searchQueries: string[]
      gender: string
      description: string
      category: string
    }

    if (searchQueries.length === 0) {
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    let allProducts: ParsedProduct[] = []

    for (const query of searchQueries) {
      const genderQuery = buildGenderQuery(query, gender)
      const raw = await searchSerper(genderQuery)
      const parsed = parseSerperResults(raw)
      const filtered = filterProducts(parsed, gender)
      allProducts = deduplicateByLink([...allProducts, ...filtered])

      if (allProducts.length >= 8) break
    }

    if (allProducts.length === 0) {
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    let ranked: ParsedProduct[]
    if (description) {
      ranked = await rerankWithAI(allProducts, description, category, gender)
    } else {
      ranked = naiveFallbackSort(allProducts, searchQueries[0])
    }

    const products = ranked.slice(0, 6)

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}
