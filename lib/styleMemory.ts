"use client"

import type { StyleProfile, InferredProfile } from "@/types"
import type { Product } from "@/types"

const STORAGE_KEY = "irl_style_profile"
const ACTIVATION_THRESHOLD = 3 // uploads needed before personalization activates

// ─── Default empty profile ───────────────────────────────────────────────────

function getDefaultProfile(): StyleProfile {
  return {
    uploads: 0,
    aesthetics: [],
    dominantColors: [],
    silhouettes: [],
    occasions: [],
    gender: "unknown",
    ageRange: "unknown",
    priceRange: {
      min: 0,
      max: 0,
      average: 0,
      selections: [],
    },
    preferredRetailers: {},
    lastUpdated: new Date().toISOString(),
  }
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

export function getStyleProfile(): StyleProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return getDefaultProfile()
    return JSON.parse(stored) as StyleProfile
  } catch {
    return getDefaultProfile()
  }
}

function saveStyleProfile(profile: StyleProfile): void {
  try {
    profile.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // localStorage full or disabled — fail silently, never crash the app
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addUnique(
  existing: string[],
  incoming: string[],
  maxLength: number = 5
): string[] {
  const combined = [...existing]
  incoming.forEach((item) => {
    const normalized = item.toLowerCase().trim()
    if (normalized && !combined.map((s) => s.toLowerCase()).includes(normalized)) {
      combined.push(item)
    }
  })
  return combined.slice(-maxLength)
}

function topRetailers(
  retailers: { [key: string]: number },
  count: number = 2
): string[] {
  return Object.entries(retailers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([name]) => name)
}

// ─── Update: called after every Gemini analysis completes ────────────────────

export function updateProfileOnAnalysis(inferred: InferredProfile): void {
  const profile = getStyleProfile()

  profile.uploads += 1

  if (inferred.aesthetic && inferred.aesthetic !== "unknown") {
    profile.aesthetics = addUnique(profile.aesthetics, [inferred.aesthetic])
  }
  if (inferred.dominantColors?.length) {
    profile.dominantColors = addUnique(profile.dominantColors, inferred.dominantColors)
  }
  if (inferred.silhouettes?.length) {
    profile.silhouettes = addUnique(profile.silhouettes, inferred.silhouettes)
  }
  if (inferred.occasion && inferred.occasion !== "unknown") {
    profile.occasions = addUnique(profile.occasions, [inferred.occasion], 3)
  }

  if (inferred.gender && inferred.gender !== "unknown") {
    profile.gender = inferred.gender
  }
  if (inferred.ageRange && inferred.ageRange !== "unknown") {
    profile.ageRange = inferred.ageRange
  }

  saveStyleProfile(profile)
}

// ─── Update: called every time user adds a product to their look ──────────────

export function updateProfileOnSelection(product: Product): void {
  const profile = getStyleProfile()

  if (product.price > 0) {
    const selections = [
      ...(profile.priceRange.selections || []).slice(-9),
      product.price,
    ]
    profile.priceRange.selections = selections
    profile.priceRange.min = Math.min(...selections)
    profile.priceRange.max = Math.max(...selections)
    profile.priceRange.average = Math.round(
      selections.reduce((a, b) => a + b, 0) / selections.length
    )
  }

  if (product.source) {
    profile.preferredRetailers[product.source] =
      (profile.preferredRetailers[product.source] || 0) + 1
  }

  saveStyleProfile(profile)
}

// ─── Get context string to inject into Gemini analyze prompt ─────────────────

export function getPersonalizationContext(): string | null {
  const profile = getStyleProfile()

  if (profile.uploads < ACTIVATION_THRESHOLD) return null

  const retailers = topRetailers(profile.preferredRetailers)
  const hasPrice = profile.priceRange.selections.length > 0
  const avgPrice = profile.priceRange.average
  const minBias = Math.round(avgPrice * 0.6)
  const maxBias = Math.round(avgPrice * 1.8)

  const lines: string[] = [
    `PERSONALIZATION CONTEXT — This user has uploaded ${profile.uploads} outfits previously.`,
    `Their established style profile:`,
  ]

  if (profile.aesthetics.length > 0) {
    lines.push(`- Aesthetic direction: ${profile.aesthetics.join(", ")}`)
  }
  if (profile.dominantColors.length > 0) {
    lines.push(`- Color preferences: ${profile.dominantColors.join(", ")}`)
  }
  if (profile.silhouettes.length > 0) {
    lines.push(`- Preferred silhouettes: ${profile.silhouettes.join(", ")}`)
  }
  if (profile.occasions.length > 0) {
    lines.push(`- Common occasions: ${profile.occasions.join(", ")}`)
  }
  if (hasPrice) {
    lines.push(
      `- Typical spend per piece: ₹${profile.priceRange.min}–₹${profile.priceRange.max} (average ₹${avgPrice})`
    )
  }
  if (retailers.length > 0) {
    lines.push(`- Preferred retailers: ${retailers.join(", ")}`)
  }

  lines.push(``)
  lines.push(`Use this profile to:`)
  lines.push(`1. Make searchQuery values more specific to their established aesthetic`)
  if (hasPrice) {
    lines.push(`2. Bias product search toward ₹${minBias}–₹${maxBias} price range`)
  }
  if (retailers.length > 0) {
    lines.push(`3. Include "${retailers[0]}" in search queries where it naturally fits`)
  }
  lines.push(`4. If this new outfit differs from their usual style, analyze it accurately anyway`)

  return lines.join("\n")
}
