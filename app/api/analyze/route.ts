import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPG, PNG, or WEBP." }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large. Maximum 5MB." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString("base64")

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `You are a fashion expert AI. Carefully analyze this outfit image.
Identify EVERY visible clothing item and accessory. This includes: tops, shirts, blouses, jackets, coats, blazers, sweaters, hoodies, trousers, jeans, leggings, skirts, dresses, shorts, shoes, sneakers, heels, sandals, boots, bags, handbags, clutches, backpacks, belts, scarves, hats, caps, jewelry, necklaces, earrings, bracelets, watches, sunglasses — anything worn or carried.
For each item provide:
- category: the item type in one word (jacket, top, jeans, sneakers, bag, belt, watch, etc.)
- description: detailed description including color, style, fit, pattern, and material if visible
- searchQuery: a 6-8 word query to find this exact item on Indian fashion e-commerce (include "women" or "men" based on the outfit, and add "India" at the end)
CRITICAL RULES:
- Return ONLY raw valid JSON. No markdown. No code fences. No explanation. Just the JSON.
- Include ALL visible items. Do not skip accessories, shoes, or bags.
- If an item is partially visible, still include it.
Return this exact JSON format:
{"items":[{"category":"jacket","description":"Oversized olive green canvas utility jacket with multiple chest pockets and dropped shoulders","searchQuery":"oversized olive green utility jacket women India"},{"category":"top","description":"White fitted ribbed tank top, cropped length","searchQuery":"white ribbed fitted crop tank top women India"}]}`

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const responseText = result.response.text()

    const cleaned = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    let parsed: { items: Array<{ category: string; description: string; searchQuery: string }> }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 })
    }

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json({ error: "Unexpected AI response format." }, { status: 500 })
    }

    const items = parsed.items.map((item, index) => ({
      ...item,
      id: String(index),
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Analyze error:", error)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
