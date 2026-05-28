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

    const prompt = `You are a fashion expert AI specialising in Indian e-commerce. Carefully analyze this outfit image.
Identify EVERY visible clothing item and accessory. This includes: tops, shirts, blouses, jackets, coats, blazers, sweaters, hoodies, trousers, jeans, leggings, skirts, dresses, kurtas, salwars, dupattas, shorts, shoes, sneakers, heels, sandals, kolhapuris, boots, bags, handbags, clutches, sling bags, tote bags, potli bags, backpacks, belts, scarves, hats, caps, jewelry, necklaces, earrings, bracelets, watches, sunglasses — anything worn or carried.

For each item provide:
- category: the item type in one word (jacket, top, jeans, sneakers, bag, belt, watch, kurta, etc.)
- description: detailed description including color, style, fit, pattern, and fabric if visible
- searchQuery: a 6-8 word query optimised for Indian fashion e-commerce sites like Myntra, Ajio, Nykaa Fashion

SEARCHQUERY RULES — follow these exactly:
1. Fit terminology: use "boyfriend fit" (not "relaxed" or "oversized"), "slim fit", "straight fit", "boxy fit"
2. Color: use "solid" (not "plain" or "plain colored"), e.g. "solid black", "solid white"
3. Ethnic wear: use "ethnic wear", "kurta set", "salwar suit", "dupatta" for Indian clothing
4. Style context: always include ONE of — casual, formal, party, ethnic, western
5. Fabric: include when identifiable — "linen", "cotton", "denim", "chiffon", "silk", "georgette", "rayon", "polyester"
6. Footwear terms: "sneakers", "block heels", "kitten heels", "kolhapuris", "juttis", "wedges", "loafers", "mules"
7. Bag terms: "sling bag", "tote bag", "potli bag", "clutch", "hobo bag", "structured bag"
8. Always end with "women" or "men" (based on the outfit) — do NOT add "India" at the end

CRITICAL RULES:
- Return ONLY raw valid JSON. No markdown. No code fences. No explanation. Just the JSON.
- Include ALL visible items. Do not skip accessories, shoes, or bags.
- If an item is partially visible, still include it.

Return this exact JSON format:
{"items":[{"category":"jeans","description":"Blue boyfriend fit denim jeans with slight distressing at the knees, mid-rise waist","searchQuery":"blue boyfriend fit casual distressed denim jeans women"},{"category":"top","description":"White solid cotton fitted crop top, sleeveless","searchQuery":"white solid cotton sleeveless crop top casual women"},{"category":"bag","description":"Small tan brown structured sling bag with gold hardware","searchQuery":"tan brown structured sling bag casual western women"}]}`

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
