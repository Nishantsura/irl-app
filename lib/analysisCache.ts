"use client"

import type { ClothingItem, InferredProfile } from "@/types"

const CACHE_KEY = "irl_analysis_cache"
const MAX_ENTRIES = 20

export interface CacheEntry {
  items: ClothingItem[]
  inferredProfile: InferredProfile
  cachedAt: string
}

interface AnalysisCache {
  [imageHash: string]: CacheEntry
}

// ─── Image compression ─────────────────────────────────────────────────────────
// Compress to max 400px wide before hashing so the same photo loaded
// as different file formats (JPEG vs WebP) or with different metadata
// always produces the same hash.

async function compressForHash(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxWidth = 400
      const ratio = Math.min(maxWidth / img.width, 1)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext("2d")
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// ─── SHA-256 via Web Crypto ────────────────────────────────────────────────────

async function sha256(str: string): Promise<string> {
  const data = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Compress then hash — exported so page.tsx can call it before the API request
export async function hashImage(dataUrl: string): Promise<string> {
  const compressed = await compressForHash(dataUrl)
  return sha256(compressed)
}

// ─── localStorage helpers ──────────────────────────────────────────────────────

function readCache(): AnalysisCache {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    return stored ? (JSON.parse(stored) as AnalysisCache) : {}
  } catch {
    return {}
  }
}

function writeCache(cache: AnalysisCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Storage full — fail silently, never crash the app
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getCachedAnalysis(hash: string): CacheEntry | null {
  try {
    const cache = readCache()
    return cache[hash] ?? null
  } catch {
    return null
  }
}

export function setCachedAnalysis(
  hash: string,
  items: ClothingItem[],
  inferredProfile: InferredProfile
): void {
  try {
    const cache = readCache()

    // Evict the oldest entry when at the 20-entry limit
    const entries = Object.entries(cache)
    if (entries.length >= MAX_ENTRIES) {
      const [oldestKey] = entries.reduce((oldest, current) =>
        new Date(current[1].cachedAt) < new Date(oldest[1].cachedAt) ? current : oldest
      )
      delete cache[oldestKey]
    }

    cache[hash] = { items, inferredProfile, cachedAt: new Date().toISOString() }
    writeCache(cache)
  } catch {
    // Fail silently
  }
}
