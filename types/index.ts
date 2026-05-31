export interface ClothingItem {
  id: string
  category: string
  description: string
  searchQuery: string
  searchQueries: string[]
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

// ── Feature: Save System ──────────────────────────────────────────────────────

export interface SavedProduct {
  id: string                    // unique: `${product.link}_${Date.now()}`
  product: Product              // full Product object
  category: string              // clothing category (jacket, top, etc.)
  outfitContext: string         // brief description from ClothingItem
  savedAt: string               // ISO date string
}

export interface SavedLook {
  id: string                    // unique: `look_${Date.now()}`
  outfitImageCompressed: string // base64 compressed outfit photo (max 400px wide)
  selectedProducts: Array<{
    category: string
    description: string
    product: Product
  }>
  totalPrice: number
  totalFormatted: string        // "₹3,987"
  coherenceScore: CoherenceScore | null
  itemCount: number
  savedAt: string               // ISO date string
}
