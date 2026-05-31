"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ClothingItem, Product, ProductResults, SelectedItems, SearchingState, InferredProfile, CoherenceScore, AnalyzeResponse } from "@/types"
import { extractColorFromImage, applyColorToDom, resetColorOnDom } from "@/lib/extractColor"
import { updateProfileOnAnalysis, updateProfileOnSelection, getPersonalizationContext } from "@/lib/styleMemory"
import { getSaveCounts } from "@/lib/savedItems"
import { hashImage, getCachedAnalysis, setCachedAnalysis } from "@/lib/analysisCache"
import OutfitBreakdown from "@/components/OutfitBreakdown"
import MyLookCart from "@/components/MyLookCart"
import HeroHome from "@/components/HeroHome"
import { track, getSessionCount } from "@/lib/analytics"

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])
  const [productResults, setProductResults] = useState<ProductResults>({})
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [searchingItems, setSearchingItems] = useState<SearchingState>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const scrolled = scrollY > 60
  const [hasImage, setHasImage] = useState(false)

  // Feature: Style Memory + Coherence Scoring
  const [inferredProfile, setInferredProfile] = useState<InferredProfile | null>(null)
  const [coherenceScore, setCoherenceScore] = useState<CoherenceScore | null>(null)
  const [isScoringOutfit, setIsScoringOutfit] = useState(false)

  // Feature: Previous Look — one-level back navigation within the session
  const [currentHash, setCurrentHash] = useState<string | null>(null)
  const [previousHash, setPreviousHash] = useState<string | null>(null)
  const [previousImage, setPreviousImage] = useState<string | null>(null)

  // Feature: Save system — badge count in navbar
  const [savedCount, setSavedCount] = useState(0)

  // Tracks if look_assembled has fired for the current analysis
  const lookAssembledFired = useRef(false)

  function refreshSavedCount() {
    try {
      const { products, looks } = getSaveCounts()
      setSavedCount(products + looks)
    } catch { /* ignore */ }
  }

  const selectedCount = Object.keys(selectedItems).length
  const totalPrice = Object.values(selectedItems).reduce((sum, p) => sum + p.price, 0)
  const totalFormatted = `₹${totalPrice.toLocaleString("en-IN")}`
  const isHome = !uploadedImage && !isAnalyzing

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    refreshSavedCount()
  }, [])

  // ── Session restore — rehydrate results page after a refresh ─────────────
  useEffect(() => {
    try {
      const savedImage = sessionStorage.getItem("irl_session_image")
      const savedHash  = sessionStorage.getItem("irl_session_hash")
      if (!savedImage || !savedHash) return

      const cached = getCachedAnalysis(savedHash)
      if (!cached) {
        // Analysis cache was evicted — can't restore, clean up
        sessionStorage.removeItem("irl_session_image")
        sessionStorage.removeItem("irl_session_hash")
        return
      }

      // Restore all results-page state
      setUploadedImage(savedImage)
      setHasImage(true)
      setCurrentHash(savedHash)
      setClothingItems(cached.items)
      if (cached.inferredProfile) setInferredProfile(cached.inferredProfile)
      extractColorFromImage(savedImage).then(applyColorToDom)

      // Re-run product searches (prices may have changed)
      cached.items.forEach((item) => searchForItem(item, cached.inferredProfile ?? null))
    } catch { /* sessionStorage unavailable — skip silently */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // ──────────────────────────────────────────────────────────────────────────

  // app_opened — fires once on mount
  useEffect(() => {
    track("app_opened", {
      source: document.referrer || "",
      device: window.innerWidth < 768 ? "mobile" : "desktop",
      is_returning: !!localStorage.getItem("irl_style_profile"),
      hour_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
    })
  }, [])

  // session_summary — fires on tab close/navigate away
  useEffect(() => {
    function handleBeforeUnload() {
      track("session_summary", {
        analyses_this_session: getSessionCount("outfit_uploaded"),
        products_saved_this_session: getSessionCount("product_saved"),
        looks_saved_this_session: getSessionCount("look_saved"),
        hard_conversions_this_session: getSessionCount("buy_clicked"),
        total_session_products_viewed: getSessionCount("clothing_section_viewed"),
      })
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const dynamicBgStyle = hasImage
    ? {
        background: `linear-gradient(180deg,
          rgba(var(--color-vibrant-rgb), 0.85) 0%,
          rgba(var(--color-vibrant-rgb), 0.4) 25%,
          rgba(var(--color-vibrant-rgb), 0.15) 45%,
          #0a0a0a 70%
        )`,
        transition: "background 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }
    : {}

  async function searchForItem(item: ClothingItem, profile: InferredProfile | null) {
    setSearchingItems((prev) => ({ ...prev, [item.id]: true }))
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchQueries: item.searchQueries || [item.searchQuery],
          gender: profile?.gender || "unknown",
          description: item.description,
          category: item.category,
        }),
      })
      const data = await res.json()
      const products: Product[] = data.products || []
      setProductResults((prev) => ({ ...prev, [item.id]: products }))
      if (products.length === 0) {
        track("no_results_found", { category: item.category, search_query: item.searchQuery })
      } else {
        track("search_completed", {
          category: item.category,
          results_count: products.length,
          has_ratings: products.some((p) => p.rating > 0),
        })
      }
    } catch {
      setProductResults((prev) => ({ ...prev, [item.id]: [] }))
    } finally {
      setSearchingItems((prev) => ({ ...prev, [item.id]: false }))
    }
  }

  async function handleImageUpload(file: File) {
    // ── Save previous look pointer before resetting ────────────────────────
    // If there's a current analysis, stash its hash + image so the user
    // can tap "← Previous look" to return to it.
    if (currentHash && uploadedImage) {
      setPreviousHash(currentHash)
      setPreviousImage(uploadedImage)
      try { sessionStorage.setItem("irl_previous_hash", currentHash) } catch { /* ignore */ }
    } else {
      setPreviousHash(null)
      setPreviousImage(null)
      try { sessionStorage.removeItem("irl_previous_hash") } catch { /* ignore */ }
    }
    // ──────────────────────────────────────────────────────────────────────

    setError(null)
    setClothingItems([])
    setProductResults({})
    setSelectedItems({})
    setSearchingItems({})
    setInferredProfile(null)
    setCoherenceScore(null)
    setCurrentHash(null)

    // Read file → dataUrl first (needed for both preview and hashing)
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })

    setUploadedImage(dataUrl)
    setHasImage(true)
    // Color extraction is fire-and-forget — runs in parallel with analysis
    extractColorFromImage(dataUrl).then(applyColorToDom)

    setIsAnalyzing(true)
    try {
      // ── Cache lookup ──────────────────────────────────────────────────────
      let items: ClothingItem[]
      let profile: InferredProfile | undefined

      let hash: string | null = null
      try { hash = await hashImage(dataUrl) } catch { /* skip cache on hash failure */ }

      if (hash) setCurrentHash(hash)

      const cached = hash ? getCachedAnalysis(hash) : null

      if (cached) {
        // Cache hit — use stored result, skip Gemini entirely
        items = cached.items
        profile = cached.inferredProfile
      } else {
        // Cache miss — call Gemini as normal
        const formData = new FormData()
        formData.append("image", file)

        const personalizationContext = getPersonalizationContext()
        if (personalizationContext) {
          formData.append("personalizationContext", personalizationContext)
        }

        const res = await fetch("/api/analyze", { method: "POST", body: formData })
        const data: AnalyzeResponse = await res.json()

        if (!data.items) {
          track("analysis_failed", { error_type: "parse_error" })
          setError((data as { error?: string }).error || "Analysis failed. Please try again.")
          return
        }

        items = data.items
        profile = data.inferredProfile

        // Store result for future uploads of the same image
        if (hash && profile) {
          setCachedAnalysis(hash, items, profile)
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      setClothingItems(items)

      // Persist session so refresh restores the results page
      try {
        sessionStorage.setItem("irl_session_image", dataUrl)
        if (hash) sessionStorage.setItem("irl_session_hash", hash)
      } catch { /* quota exceeded — skip silently */ }

      if (profile) {
        setInferredProfile(profile)
        updateProfileOnAnalysis(profile)
        track("analysis_completed", {
          items_found: items.length,
          aesthetic: profile.aesthetic,
          gender: profile.gender,
          occasion: profile.occasion,
          dominant_colors: profile.dominantColors,
          silhouettes: profile.silhouettes,
          was_cached: !!cached,
        })
      }

      // Reset look_assembled tracker for this new analysis
      lookAssembledFired.current = false

      // Product searches always run fresh — prices change daily
      items.forEach((item: ClothingItem) => searchForItem(item, profile ?? null))
    } catch (err) {
      const errorType = err instanceof TypeError ? "network" : "unknown"
      track("analysis_failed", { error_type: errorType })
      setError("Something went wrong. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleRestorePreviousLook() {
    if (!previousHash || !previousImage) return

    const cached = getCachedAnalysis(previousHash)
    if (!cached) {
      // Cache was cleared — dismiss silently
      setPreviousHash(null)
      setPreviousImage(null)
      try { sessionStorage.removeItem("irl_previous_hash") } catch { /* ignore */ }
      return
    }

    // Restore the previous outfit
    setUploadedImage(previousImage)
    setHasImage(true)
    extractColorFromImage(previousImage).then(applyColorToDom)

    setClothingItems(cached.items)
    setProductResults({})
    setSearchingItems({})
    setSelectedItems({})
    setCoherenceScore(null)
    setCartOpen(false)
    setError(null)

    if (cached.inferredProfile) {
      setInferredProfile(cached.inferredProfile)
    }

    // The restored look is now the current one
    setCurrentHash(previousHash)

    // Consume the pointer — one level only
    setPreviousHash(null)
    setPreviousImage(null)
    try { sessionStorage.removeItem("irl_previous_hash") } catch { /* ignore */ }

    // Re-run Serper for fresh product cards
    cached.items.forEach((item) => searchForItem(item, cached.inferredProfile ?? null))
  }

  function validateAndUpload(file: File) {
    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type) || file.size > 5 * 1024 * 1024) return
    track("outfit_uploaded", {
      file_size_kb: Math.round(file.size / 1024),
      file_type: file.type,
      device: window.innerWidth < 768 ? "mobile" : "desktop",
    })
    handleImageUpload(file)
  }

  function handleAddToLook(itemId: string, product: Product) {
    const key = `${itemId}__${product.link}`
    setSelectedItems((prev) => {
      let updated: SelectedItems

      if (prev[key]) {
        // Deselecting
        track("product_removed_from_look", {
          category: itemId.split("__")[0],
          brand: product.source,
          price: product.price,
        })
        updated = { ...prev }
        delete updated[key]
      } else {
        updateProfileOnSelection(product)
        updated = { ...prev, [key]: product }
        const products = productResults[itemId] || []
        const positionInResults = products.findIndex((p) => p.link === product.link)
        const newCount = Object.keys(updated).length
        track("product_added_to_look", {
          category: itemId,
          brand: product.source,
          price: product.price,
          position_in_results: positionInResults,
          items_in_look_after: newCount,
        })
        // look_assembled fires once at 2 items per analysis session
        if (newCount === 2 && !lookAssembledFired.current) {
          lookAssembledFired.current = true
          const uniqueSources = [...new Set(Object.values(updated).map((p) => p.source))]
          track("look_assembled", {
            items_count: newCount,
            total_value: Object.values(updated).reduce((s, p) => s + p.price, 0),
            retailers_included: uniqueSources,
            has_score: coherenceScore !== null,
          })
        }
      }

      const count = Object.keys(updated).length
      if (count >= 2 && inferredProfile) {
        scoreOutfit(updated, inferredProfile)
      } else {
        setCoherenceScore(null)
      }

      return updated
    })
  }

  async function scoreOutfit(currentSelected: SelectedItems, profile: InferredProfile) {
    setIsScoringOutfit(true)
    try {
      const items = Object.entries(currentSelected).map(([key, product]) => {
        const itemId = key.split("__")[0]
        const clothingItem = clothingItems.find((c) => c.id === itemId)
        return {
          category: clothingItem?.category || "item",
          title: product.title,
          brand: product.brand,
          price: product.priceFormatted,
          source: product.source,
        }
      })

      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, inferredProfile: profile }),
      })

      const score: CoherenceScore & { error?: string } = await res.json()
      if (!score.error) {
        setCoherenceScore(score)
        track("outfit_scored", {
          score: score.score,
          style_label: score.style,
          color_story: score.colorStory,
          items_count: Object.keys(currentSelected).length,
          total_value: Object.values(currentSelected).reduce((s, p) => s + p.price, 0),
        })
      }
    } catch {
      setCoherenceScore(null)
    } finally {
      setIsScoringOutfit(false)
    }
  }

  function openCart() {
    setCartOpen(true)
    track("cart_opened", { items_count: selectedCount, total_value: totalPrice })
  }

  function handleRemoveFromLook(itemId: string) {
    setSelectedItems((prev) => {
      const updated = { ...prev }
      delete updated[itemId]
      return updated
    })
  }

  function handleReset() {
    setUploadedImage(null)
    setHasImage(false)
    setClothingItems([])
    setProductResults({})
    setSelectedItems({})
    setIsAnalyzing(false)
    setSearchingItems({})
    setCartOpen(false)
    setError(null)
    setInferredProfile(null)
    setCoherenceScore(null)
    setCurrentHash(null)
    setPreviousHash(null)
    setPreviousImage(null)
    try {
      sessionStorage.removeItem("irl_previous_hash")
      sessionStorage.removeItem("irl_session_image")
      sessionStorage.removeItem("irl_session_hash")
    } catch { /* ignore */ }
    resetColorOnDom()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>

      {/* ── Navbar ── */}
      {!isHome && (
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: (() => {
              if (!scrolled) return "transparent"
              // Mirror the page gradient: vibrant fades out, dark fades in over 60–700px scroll
              const t = Math.min(1, (scrollY - 60) / 640)
              const vOp = (0.88 * (1 - t * 0.9)).toFixed(2)  // 0.88 → ~0.09
              const dOp = (t * 0.85).toFixed(2)               // 0 → 0.85
              return `rgba(var(--color-vibrant-rgb),${vOp}), rgba(10,10,10,${dOp})`
            })(),
            backdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          <div className="flex items-center justify-between h-14 lg:h-16 px-4 lg:px-10 xl:px-16"
            style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <button
              onClick={handleReset}
              className="text-base lg:text-lg"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-serif)",
                color: "white",
                letterSpacing: "-0.5px",
                padding: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              IRL
            </button>

            {/* Right side nav items */}
            <div className="flex items-center gap-3">
              {/* Saved link */}
              <Link
                href="/saved"
                className="relative flex items-center gap-1.5 transition-all duration-150"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                  WebkitTapHighlightColor: "transparent",
                  minHeight: "36px",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "white" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)" }}
              >
                {/* Mobile/tablet: icon only */}
                <span className="block lg:hidden">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </span>
                {/* Desktop: text */}
                <span className="hidden lg:block text-sm">Saved</span>

                {/* Count badge */}
                {savedCount > 0 && (
                  <span
                    className="flex items-center justify-center"
                    style={{
                      width: "16px", height: "16px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 600,
                      fontSize: "10px",
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {savedCount > 9 ? "9+" : savedCount}
                  </span>
                )}
              </Link>

              {/* My Look cart button */}
              {selectedCount > 0 && (
                <button
                  onClick={openCart}
                  className="flex items-center gap-1.5 rounded-full text-white transition-all duration-150 px-3 py-1.5 text-xs lg:px-5 lg:py-2 lg:text-sm"
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    fontFamily: "var(--font-dm-sans)",
                    fontWeight: 500,
                    WebkitTapHighlightColor: "transparent",
                    minHeight: "36px",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                >
                  <span className="lg:hidden">Look ({selectedCount})</span>
                  <span className="hidden lg:inline">My Look · {selectedCount}</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* ── STATE A: Hero Home ── */}
      {!uploadedImage && !isAnalyzing && (
        <HeroHome
          onImageSelected={validateAndUpload}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* ── STATE B: Analyzing ── */}
      {isAnalyzing && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6"
          style={{ backgroundColor: "rgba(10,10,10,0.6)" }}
        >
          <div
            className="animate-spin-custom w-10 h-10 md:w-12 md:h-12"
            style={{
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTop: "2px solid white",
            }}
          />
          <div className="text-center">
            <p
              className="text-white text-2xl md:text-3xl"
              style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.5px" }}
            >
              Analyzing your outfit
            </p>
            <p
              className="text-white/50 mt-2 text-sm md:text-base"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              Identifying every piece...
            </p>
          </div>
        </div>
      )}

      {/* ── Dynamic gradient wrapper for results ── */}
      {!isHome && (
        <main className="min-h-screen" style={dynamicBgStyle}>

          {/* Error */}
          {error && (
            <div className="px-4 md:px-8 pt-16 md:pt-20" style={{ maxWidth: "1280px", margin: "0 auto" }}>
              <div
                className="flex items-center justify-between rounded-xl px-4 md:px-5 py-3 md:py-4"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <p className="text-red-400 text-sm" style={{ fontFamily: "var(--font-dm-sans)" }}>{error}</p>
                <button
                  onClick={handleReset}
                  className="text-red-400 hover:text-red-300 transition-colors text-sm underline ml-4"
                  style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* STATE C: Results */}
          {uploadedImage && !isAnalyzing && clothingItems.length > 0 && (
            <div
              className="px-5 md:px-6 lg:px-10 xl:px-16 pt-20 pb-8 md:pb-10 lg:pb-12 xl:pb-16"
              style={{ maxWidth: "1280px", margin: "0 auto" }}
            >
              {/* Two-column on lg+, single column below */}
              <div className="flex flex-col lg:flex-row lg:items-start">

                {/* Left column — full width mobile, sticky 38% on lg+ */}
                <div className="w-full lg:w-[38%] lg:flex-shrink-0 lg:sticky lg:top-[88px] lg:self-start mb-4 lg:mb-0 lg:pr-10">

                  {/* Image */}
                  <div
                    className="rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] lg:shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <img
                      src={uploadedImage}
                      alt="Your outfit"
                      className="w-full block object-cover max-h-[56vw] lg:max-h-[520px]"
                    />
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between mt-3 lg:mt-4">
                    <span
                      className="inline-flex items-center rounded-full uppercase text-[10px] lg:text-[11px]"
                      style={{
                        padding: "5px 12px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.5)",
                        letterSpacing: "1.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {clothingItems.length} items found
                    </span>
                    <button
                      onClick={handleReset}
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 400,
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.35)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: "color 0.15s ease",
                        WebkitTapHighlightColor: "transparent",
                        minHeight: "44px",
                        display: "flex",
                        alignItems: "center",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)" }}
                    >
                      Upload new ↑
                    </button>
                  </div>

                  {/* Previous look — only visible when a prior analysis exists */}
                  {previousHash && previousImage && (
                    <button
                      onClick={handleRestorePreviousLook}
                      className="text-xs"
                      style={{
                        marginTop: "8px",
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.25)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: "color 0.15s ease",
                        WebkitTapHighlightColor: "transparent",
                        display: "block",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)" }}
                    >
                      ← Previous look
                    </button>
                  )}
                </div>

                {/* Right column */}
                <div className="w-full lg:w-[62%] mt-2 lg:mt-0">
                  <OutfitBreakdown
                    clothingItems={clothingItems}
                    productResults={productResults}
                    searchingItems={searchingItems}
                    selectedItems={selectedItems}
                    onAddToLook={handleAddToLook}
                  />

                  {/* "View My Look" — fixed bottom bar on mobile/iPad, sticky inline on lg+ */}
                  {selectedCount > 0 && (
                    <>
                      {/* Mobile + iPad: fixed bottom bar */}
                      <div
                        className="fixed bottom-0 left-0 right-0 lg:hidden z-50 px-4 py-3"
                        style={{
                          background: "rgba(10,10,10,0.95)",
                          backdropFilter: "blur(16px)",
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <button
                          onClick={openCart}
                          className="w-full flex items-center justify-center gap-2 text-white text-sm"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: 500,
                            cursor: "pointer",
                            WebkitTapHighlightColor: "transparent",
                          }}
                        >
                          View My Look · {selectedCount} {selectedCount === 1 ? "item" : "items"}
                        </button>
                      </div>

                      {/* lg+: inline sticky button */}
                      <div className="hidden lg:block sticky bottom-4 mt-6">
                        <button
                          onClick={openCart}
                          className="w-full flex items-center justify-center gap-2 text-white transition-all duration-200"
                          style={{
                            height: "52px",
                            borderRadius: "14px",
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            backdropFilter: "blur(16px)",
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: 500,
                            fontSize: "15px",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.16)" }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)" }}
                        >
                          View My Look · {selectedCount} {selectedCount === 1 ? "item" : "items"}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Spacer so fixed bar doesn't overlap last card on mobile */}
                  {selectedCount > 0 && <div className="h-20 lg:hidden" />}
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      <MyLookCart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        selectedItems={selectedItems}
        clothingItems={clothingItems}
        totalFormatted={totalFormatted}
        totalPrice={totalPrice}
        onRemove={handleRemoveFromLook}
        coherenceScore={coherenceScore}
        isScoringOutfit={isScoringOutfit}
        uploadedImage={uploadedImage}
        onLookSaved={refreshSavedCount}
      />
    </div>
  )
}
