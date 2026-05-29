export interface ClothingItem {
  id: string
  category: string
  description: string
  searchQuery: string
}

export interface Product {
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

export interface SelectedItems {
  [clothingItemId: string]: Product
}

export interface ProductResults {
  [clothingItemId: string]: Product[]
}

export interface SearchingState {
  [clothingItemId: string]: boolean
}

// ── Feature: Style Memory ─────────────────────────────────────────────────────

export interface InferredProfile {
  gender: "women" | "men" | "unisex" | "unknown"
  ageRange: "teens" | "20s" | "30s" | "40s+" | "unknown"
  aesthetic:
    | "minimalist"
    | "streetwear"
    | "ethnic"
    | "boho"
    | "corporate"
    | "smart-casual"
    | "party"
    | "luxury"
    | "vintage"
    | "athleisure"
    | "Y2K"
    | "cottagecore"
    | "unknown"
  occasion:
    | "casual"
    | "work"
    | "evening"
    | "party"
    | "ethnic-occasion"
    | "workout"
    | "travel"
    | "unknown"
  dominantColors: string[]
  silhouettes: string[]
}

export interface StyleProfile {
  uploads: number
  aesthetics: string[]
  dominantColors: string[]
  silhouettes: string[]
  occasions: string[]
  gender: string
  ageRange: string
  priceRange: {
    min: number
    max: number
    average: number
    selections: number[]
  }
  preferredRetailers: { [retailer: string]: number }
  lastUpdated: string
}

// ── Feature: Coherence Scoring ────────────────────────────────────────────────

export interface CoherenceScore {
  score: number
  style: string
  tip: string
  colorStory: string
}

export interface AnalyzeResponse {
  items: ClothingItem[]
  inferredProfile: InferredProfile
}
