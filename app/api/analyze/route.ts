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
- searchQueries: an array of EXACTLY 3 search queries to find this item, ordered by specificity:
  1. SPECIFIC (6-8 words): precise description — fabric, fit, color, pattern, gender, "India"
  2. BRANDED (6-8 words): same item but phrased to surface branded results — include "branded" or a retailer name (Myntra, Ajio, H&M, Zara). E.g. "branded oversized linen shirt women Myntra"
  3. FALLBACK (4-5 words): broader category search for backup. E.g. "oversized linen shirt women India"

RULES FOR searchQueries:
✓ Include fabric if visible: linen, cotton, denim, silk, chiffon, leather, suede, georgette
✓ Include fit: fitted, relaxed, oversized, straight, wide-leg, slim, A-line
✓ Include gender: women or men (match the outfit's styling)
✓ End with: India (for specific and fallback queries)
✓ Be specific in query 1 — describe what makes this item distinct
✓ Query 2 must include "branded" or a specific retailer/brand name
✓ Query 3 should be shorter and broader — category + key attribute + gender
✗ Do NOT use: casual, solid, simple, basic, nice (too generic, surfaces budget results)
✗ Do NOT use Indian e-commerce buzzwords: stylish, trendy, fashionable

Good searchQueries examples:
["oversized linen shirt dropped shoulder relaxed fit women India", "branded oversized linen shirt women Myntra", "oversized linen shirt women India"]
["straight leg light wash high waist denim jeans women India", "branded high waist straight jeans women Ajio", "straight leg light wash jeans women"]
["white chunky leather platform sneakers women India", "branded white platform sneakers women H&M", "white platform sneakers women India"]

Bad searchQueries examples (do not do this):
["casual white shirt women India", ...] ← too generic
["stylish blue jeans India", ...] ← useless descriptor

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
- Every clothing item must have all three fields: category, description, searchQueries
- inferredProfile must always be present — use "unknown" for anything unclear
- Do not add any fields not specified above

Return exactly this structure (with your actual data):
{"items":[{"category":"jacket","description":"Oversized olive green canvas utility jacket with multiple chest pockets and dropped shoulders","searchQueries":["oversized canvas utility jacket dropped shoulder women India","branded oversized utility jacket women Myntra","oversized utility jacket women India"]},{"category":"top","description":"White fitted ribbed crop tank top, cropped at midriff","searchQueries":["white ribbed fitted crop tank top women India","branded ribbed crop top women H&M","white crop tank top women India"]},{"category":"jeans","description":"Straight leg light wash denim jeans, high waist, full length","searchQueries":["straight leg light wash high waist denim jeans women India","branded straight leg high waist jeans women Ajio","straight leg light wash jeans women India"]}],"inferredProfile":{"gender":"women","ageRange":"20s","aesthetic":"streetwear","occasion":"casual","dominantColors":["olive green","white","light wash denim"],"silhouettes":["oversized","fitted","straight"]}}`

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    }

    // Try primary model first, fall back to gemini-2.0-flash if overloaded
    const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

    async function generateWithFallback() {
      for (const modelName of FALLBACK_MODELS) {
        const m = genAI.getGenerativeModel({
          model: modelName,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
          ],
          // gemini-2.5-flash has thinking enabled by default; SDK v0.24.x includes
          // thought parts in response.text(), which breaks JSON.parse. Disable it.
          generationConfig: modelName === "gemini-2.5-flash"
            ? ({ thinkingConfig: { thinkingBudget: 0 } } as Record<string, unknown>)
            : undefined,
        })
        // 2 attempts per model with backoff
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            return await m.generateContent([prompt, imagePart])
          } catch (err) {
            const msg = String((err as Error)?.message ?? "")
            const status = (err as { status?: number })?.status
            const isOverloaded = status === 503 || msg.includes("503") || msg.toLowerCase().includes("overloaded") || msg.toLowerCase().includes("high demand")
            if (isOverloaded) {
              if (attempt === 0) {
                await new Promise((r) => setTimeout(r, 1500))
                continue // retry same model once
              }
              break // move to next fallback model
            }
            throw err // non-retriable — rethrow
          }
        }
      }
      throw new Error("All models overloaded. Please try again in a moment.")
    }
    const result2 = await generateWithFallback()

    // Detect safety block — Gemini sets finishReason to "SAFETY" when it
    // rejects content that violates the configured harm thresholds.
    const candidate = result2.response.candidates?.[0]
    if (!candidate || candidate.finishReason === "SAFETY") {
      return NextResponse.json(
        { error: "This image cannot be analyzed. Please upload a fashion photo." },
        { status: 400 }
      )
    }

    const responseText = result2.response.text()

    const cleaned = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    let parsed: {
      items: Array<{ category: string; description: string; searchQuery?: string; searchQueries?: string[] }>
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
      searchQueries: item.searchQueries || (item.searchQuery ? [item.searchQuery] : []),
      searchQuery: item.searchQueries?.[0] || item.searchQuery || "",
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
