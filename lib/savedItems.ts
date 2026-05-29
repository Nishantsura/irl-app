"use client"

import type { SavedProduct, SavedLook, Product, CoherenceScore, ClothingItem } from "@/types"

const PRODUCTS_KEY = "irl_saved_products"
const LOOKS_KEY = "irl_saved_looks"
const MAX_PRODUCTS = 50
const MAX_LOOKS = 20

// ─── Image Compression ────────────────────────────────────────────────────────
// Compress outfit image before saving to preserve localStorage space.
// Reduces to max 400px wide at 60% JPEG quality → ~30-50KB per look.

export async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxWidth = 400
      const ratio = Math.min(maxWidth / img.width, 1)
      const canvas = document.createElement("canvas")
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      const ctx = canvas.getContext("2d")
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", 0.6))
    }
    img.onerror = () => resolve(dataUrl) // fallback: use original
    img.src = dataUrl
  })
}

// ─── Generic localStorage helpers ─────────────────────────────────────────────

function readKey<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    return JSON.parse(stored) as T
  } catch {
    return fallback
  }
}

function writeKey<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage full — fail silently, never crash the app
  }
}

// ─── Saved Products ────────────────────────────────────────────────────────────

export function getSavedProducts(): SavedProduct[] {
  return readKey<SavedProduct[]>(PRODUCTS_KEY, [])
}

export function isProductSaved(productLink: string): boolean {
  const saved = getSavedProducts()
  return saved.some((s) => s.product.link === productLink)
}

export function saveProduct(
  product: Product,
  category: string,
  outfitContext: string
): void {
  const saved = getSavedProducts()

  // Do not save duplicates
  if (saved.some((s) => s.product.link === product.link)) return

  // Enforce max limit
  if (saved.length >= MAX_PRODUCTS) return

  const newSaved: SavedProduct = {
    id: `${product.link}_${Date.now()}`,
    product,
    category,
    outfitContext,
    savedAt: new Date().toISOString(),
  }

  writeKey(PRODUCTS_KEY, [newSaved, ...saved])
}

export function unsaveProduct(productLink: string): void {
  const saved = getSavedProducts()
  writeKey(
    PRODUCTS_KEY,
    saved.filter((s) => s.product.link !== productLink)
  )
}

export function toggleSaveProduct(
  product: Product,
  category: string,
  outfitContext: string
): boolean {
  // Returns true if now saved, false if now unsaved
  if (isProductSaved(product.link)) {
    unsaveProduct(product.link)
    return false
  } else {
    saveProduct(product, category, outfitContext)
    return true
  }
}

// ─── Saved Looks ───────────────────────────────────────────────────────────────

export function getSavedLooks(): SavedLook[] {
  return readKey<SavedLook[]>(LOOKS_KEY, [])
}

export async function saveLook(
  outfitImage: string,
  selectedItems: { [compositeKey: string]: Product },
  clothingItems: ClothingItem[],
  totalPrice: number,
  coherenceScore: CoherenceScore | null
): Promise<boolean> {
  // Returns true if saved, false if limit reached
  const saved = getSavedLooks()
  if (saved.length >= MAX_LOOKS) return false

  const compressed = await compressImage(outfitImage)

  // Keys are composite "${itemId}__${productLink}" — extract real itemId
  const selectedProducts = Object.entries(selectedItems).map(([compositeKey, product]) => {
    const itemId = compositeKey.split("__")[0]
    const clothing = clothingItems.find((c) => c.id === itemId)
    return {
      category: clothing?.category || "item",
      description: clothing?.description || "",
      product,
    }
  })

  const newLook: SavedLook = {
    id: `look_${Date.now()}`,
    outfitImageCompressed: compressed,
    selectedProducts,
    totalPrice,
    totalFormatted: `₹${totalPrice.toLocaleString("en-IN")}`,
    coherenceScore,
    itemCount: selectedProducts.length,
    savedAt: new Date().toISOString(),
  }

  writeKey(LOOKS_KEY, [newLook, ...saved])
  return true
}

export function deleteLook(lookId: string): void {
  const saved = getSavedLooks()
  writeKey(
    LOOKS_KEY,
    saved.filter((l) => l.id !== lookId)
  )
}

// ─── Storage info ──────────────────────────────────────────────────────────────

export function getSaveCounts(): { products: number; looks: number } {
  return {
    products: getSavedProducts().length,
    looks: getSavedLooks().length,
  }
}
