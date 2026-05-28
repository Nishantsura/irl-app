import { NextRequest, NextResponse } from "next/server"

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0
  const cleaned = priceStr.replace(/[₹$€£,\s]/g, "")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
    }

    const response = await fetch("https://google.serper.dev/shopping", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: "in",
        hl: "en",
        num: 10,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    const data = await response.json()
    const shoppingResults = data.shopping || []

    const products = shoppingResults
      .map((item: {
        title?: string
        price?: string
        source?: string
        link?: string
        imageUrl?: string
        rating?: number
        ratingCount?: number
      }) => {
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
      .filter((p: { price: number }) => p.price > 0)
      .sort((a: { price: number }, b: { price: number }) => a.price - b.price)
      .slice(0, 6)

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}
