import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  // ── Rate limiting: 10 requests per IP per hour ─────────────────────────────
  const ip = getClientIp(request)
  if (!checkRateLimit(`${ip}:analyze`, 10)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }
  // ──────────────────────────────────────────────────────────────────────────

  try {
    const formData = await request.formData()
    const file = formData.get("image") as File
    const personalizationContext = formData.get("personalizationContext") as string | null

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

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
      ],
    })

    const personalizationBlock = personalizationContext
      ? `${personalizationContext}\n\n`
      : ""

    const prompt = `${personalizationBlock}You are a fashion analyst and expert stylist AI. Carefully analyze this outfit image and complete two tasks.

TASK 1 — IDENTIFY ALL CLOTHING ITEMS:
Find every visible clothing item and accessory in the image.
Include: tops, shirts, blouses, jackets, coats, blazers, cardigans, sweaters, hoodies,
trousers, jeans, leggings, skirts, dresses, shorts, shoes, sneakers, heels, sandals,
boots, kolhapuris, bags, handbags, clutches, backpacks, belts, scarves, dupattas,
hats, caps, jewelry, necklaces, earrings, bangles, watches, sunglasses.
If an item is partially visible, still include it.

For each item provide exactly three fields:
- category: ONE word describing the item type (jacket, top, jeans, sneakers, bag, belt, dupatta, kurta, etc.)
- description: specific visual description including color, style, fit, pattern, fabric if visible
- searchQuery: a 6-8 word search query to find this exact item on Myntra or Ajio

RULES FOR searchQuery:
✓ Include fabric if visible: linen, cotton, denim, silk, chiffon, leather, suede, georgette
✓ Include fit: fitted, relaxed, oversized, straight, wide-leg, slim, A-line
✓ Include gender: women or men (match the outfit's styling)
✓ End with: India
✓ Be specific — describe what makes this item distinct
✗ Do NOT use: casual, solid, simple, basic, nice (too generic, surfaces budget results)
✗ Do NOT use Indian e-commerce buzzwords: stylish, trendy, fashionable

Good searchQuery examples:
"oversized linen shirt dropped shoulder relaxed fit women India"
"straight leg light wash high waist denim jeans women India"
"white chunky leather platform sneakers women India"
"small structured leather crossbody bag chain strap women India"
"wide leg palazzo trousers flowy fabric women India"

Bad searchQuery examples (do not do this):
"casual white shirt women India" ← too generic
"stylish blue jeans India" ← useless descriptor
"nice bag women India" ← not searchable

TASK 2 — INFER STYLE PROFILE:
Based on the complete outfit aesthetic, infer the following about the person this outfit is for.
Choose ONLY from the provided options for each field.

- gender: choose ONE from: "women", "men", "unisex", "unknown"
- ageRange: choose ONE from: "teens", "20s", "30s", "40s+", "unknown"
- aesthetic: choose ONE from: "minimalist", "streetwear", "ethnic", "boho", "corporate", "smart-casual", "party", "luxury", "vintage", "athleisure", "Y2K", "cottagecore", "unknown"
- occasion: choose ONE from: "casual", "work", "evening", "party", "ethnic-occasion", "workout", "travel", "unknown"
- dominantColors: array of 2-3 color descriptions that define this outfit's palette
  Examples: "earth tones", "monochrome black", "pastel pink", "navy and white", "jewel tones"
- silhouettes: array of 1-3 silhouette types visible in this outfit
  Examples: "oversized", "fitted", "relaxed", "structured", "flowy", "bodycon", "layered"

CRITICAL OUTPUT RULES:
- Return ONLY raw valid JSON. No markdown. No code fences. No explanation before or after.
- The JSON must contain exactly two top-level keys: "items" and "inferredProfile"
- Every clothing item must have all three fields: category, description, searchQuery
- inferredProfile must always be present — use "unknown" for anything unclear
- Do not add any fields not specified above

Return exactly this structure (with your actual data):
{"items":[{"category":"jacket","description":"Oversized olive green canvas utility jacket with multiple chest pockets and dropped shoulders","searchQuery":"oversized canvas utility jacket dropped shoulder women India"},{"category":"top","description":"White fitted ribbed crop tank top, cropped at midriff","searchQuery":"white ribbed fitted crop tank top women India"},{"category":"jeans","description":"Straight leg light wash denim jeans, high waist, full length","searchQuery":"straight leg light wash high waist denim jeans women India"}],"inferredProfile":{"gender":"women","ageRange":"20s","aesthetic":"streetwear","occasion":"casual","dominantColors":["olive green","white","light wash denim"],"silhouettes":["oversized","fitted","straight"]}}`

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    }

    const result = await model.generateContent([prompt, imagePart])

    // Detect safety block — Gemini sets finishReason to "SAFETY" when it
    // rejects content that violates the configured harm thresholds.
    const candidate = result.response.candidates?.[0]
    if (!candidate || candidate.finishReason === "SAFETY") {
      return NextResponse.json(
        { error: "This image cannot be analyzed. Please upload a fashion photo." },
        { status: 400 }
      )
    }

    const responseText = result.response.text()

    const cleaned = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    let parsed: {
      items: Array<{ category: string; description: string; searchQuery: string }>
      inferredProfile?: unknown
    }
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

    return NextResponse.json({ items, inferredProfile: parsed.inferredProfile ?? null })
  } catch (error) {
    // Gemini can throw when it blocks content at the request level (e.g. prompt
    // feedback block) in addition to returning a SAFETY finishReason.
    const msg = String((error as Error)?.message ?? "")
    if (msg.toUpperCase().includes("SAFETY")) {
      return NextResponse.json(
        { error: "This image cannot be analyzed. Please upload a fashion photo." },
        { status: 400 }
      )
    }
    console.error("Analyze error:", error)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
