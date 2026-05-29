import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import type { InferredProfile, CoherenceScore } from "@/types"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

interface ScoreRequestBody {
  items: Array<{
    category: string
    title: string
    brand: string
    price: string
    source: string
  }>
  inferredProfile: InferredProfile
}

export async function POST(request: NextRequest) {
  try {
    const body: ScoreRequestBody = await request.json()
    const { items, inferredProfile } = body

    if (!items || items.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 items to score an outfit" },
        { status: 400 }
      )
    }

    const itemsList = items
      .map((item, i) => `${i + 1}. ${item.category.toUpperCase()}: ${item.title} — ${item.brand} — ${item.price}`)
      .join("\n")

    const prompt = `You are a senior fashion stylist with deep expertise in Indian fashion, contemporary trends, and personal style.

A user has built an outfit by selecting the following pieces:

${itemsList}

USER CONTEXT (inferred from their style inspiration image):
Gender: ${inferredProfile.gender}
Age range: ${inferredProfile.ageRange}
Target aesthetic: ${inferredProfile.aesthetic}
Occasion: ${inferredProfile.occasion}
Color palette they started with: ${inferredProfile.dominantColors.join(", ")}

EVALUATE THIS OUTFIT COMBINATION:

Score the outfit coherence from 1.0 to 10.0 using these criteria:
1. Color harmony — do the colors complement each other or clash?
2. Proportion balance — is volume and silhouette distributed intentionally across the body?
3. Style coherence — do all pieces belong to the same aesthetic world?
4. Occasion fit — is this combination appropriate for the target occasion?
5. Personal alignment — does this match the user's established aesthetic direction?

SCORING GUIDE (be honest, not generous):
9.0–10.0 → Exceptional. Every piece elevates the others. Near-perfect.
7.0–8.9  → Strong combination. Minor adjustment would perfect it.
5.0–6.9  → Decent foundation with a noticeable gap or tension.
3.0–4.9  → Clear style conflict between pieces. Needs rethinking.
1.0–2.9  → Pieces actively clash in color, proportion, or aesthetic.

RULES FOR THE TIP:
- Exactly one sentence. No more.
- Must name a SPECIFIC clothing or accessory category (not vague like "add an accessory")
  Good: "Add a thin tan leather belt at the waist..."
  Bad: "Consider adding an accessory..."
- Must explain the WHY — what visual problem it solves or what quality it adds
- Must be realistic to buy on Indian fashion sites (Myntra, Ajio, Amazon India)
- Do NOT suggest removing any of the already selected pieces
- If the outfit is already a 9+, give a subtle enhancement tip, not a correction

RULES FOR THE STYLE LABEL:
- 2-3 words maximum
- Be specific and evocative. Avoid single generic words.
  Good: "Minimal street", "Soft corporate", "Relaxed boho", "Y2K edge", "Clean ethnic"
  Bad: "Casual", "Formal", "Stylish", "Modern"

RULES FOR colorStory:
- One short phrase describing the color narrative of this outfit
  Examples: "Earth tones with white anchor", "Monochrome with texture play", "Contrast denim and neutral"

Return ONLY raw valid JSON. No markdown. No explanation. No text before or after.
Return exactly this structure:
{"score":7.5,"style":"Minimal street","tip":"Add a thin tan leather belt at the waist to define the silhouette and break the oversized-on-oversized volume that currently flattens the proportions.","colorStory":"Earth tones with white anchor"}`

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    const cleaned = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    let score: CoherenceScore
    try {
      score = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: "Failed to parse score response" },
        { status: 500 }
      )
    }

    if (typeof score.score !== "number" || score.score < 1 || score.score > 10) {
      score.score = 5.0
    }

    return NextResponse.json(score)
  } catch (error) {
    console.error("Score error:", error)
    return NextResponse.json(
      { error: "Scoring failed. Please try again." },
      { status: 500 }
    )
  }
}
