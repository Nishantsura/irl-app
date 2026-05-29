"use client"

import { useState, useEffect, useRef, ChangeEvent, DragEvent } from "react"
import { ClothingItem, Product, ProductResults, SelectedItems, SearchingState, InferredProfile, CoherenceScore, AnalyzeResponse } from "@/types"
import { extractColorFromImage, applyColorToDom, resetColorOnDom } from "@/lib/extractColor"
import { updateProfileOnAnalysis, updateProfileOnSelection, getPersonalizationContext } from "@/lib/styleMemory"
import OutfitBreakdown from "@/components/OutfitBreakdown"
import MyLookCart from "@/components/MyLookCart"

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])
  const [productResults, setProductResults] = useState<ProductResults>({})
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [searchingItems, setSearchingItems] = useState<SearchingState>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [hasImage, setHasImage] = useState(false)

  // Home screen state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [homeDragging, setHomeDragging] = useState(false)
  const [homeHover, setHomeHover] = useState(false)

  // Feature: Style Memory + Coherence Scoring
  const [inferredProfile, setInferredProfile] = useState<InferredProfile | null>(null)
  const [coherenceScore, setCoherenceScore] = useState<CoherenceScore | null>(null)
  const [isScoringOutfit, setIsScoringOutfit] = useState(false)

  const selectedCount = Object.keys(selectedItems).length
  const totalPrice = Object.values(selectedItems).reduce((sum, p) => sum + p.price, 0)
  const totalFormatted = `₹${totalPrice.toLocaleString("en-IN")}`
  const isHome = !uploadedImage && !isAnalyzing

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
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

  async function searchForItem(item: ClothingItem) {
    setSearchingItems((prev) => ({ ...prev, [item.id]: true }))
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(item.searchQuery)}`)
      const data = await res.json()
      setProductResults((prev) => ({ ...prev, [item.id]: data.products || [] }))
    } catch {
      setProductResults((prev) => ({ ...prev, [item.id]: [] }))
    } finally {
      setSearchingItems((prev) => ({ ...prev, [item.id]: false }))
    }
  }

  async function handleImageUpload(file: File) {
    setError(null)
    setClothingItems([])
    setProductResults({})
    setSelectedItems({})
    setSearchingItems({})
    setInferredProfile(null)
    setCoherenceScore(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setUploadedImage(dataUrl)
      setHasImage(true)
      const palette = await extractColorFromImage(dataUrl)
      applyColorToDom(palette)
    }
    reader.readAsDataURL(file)

    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append("image", file)

      const personalizationContext = getPersonalizationContext()
      if (personalizationContext) {
        formData.append("personalizationContext", personalizationContext)
      }

      const res = await fetch("/api/analyze", { method: "POST", body: formData })
      const data: AnalyzeResponse = await res.json()

      if (!data.items) { setError((data as { error?: string }).error || "Analysis failed. Please try again."); return }

      setClothingItems(data.items)

      if (data.inferredProfile) {
        setInferredProfile(data.inferredProfile)
        updateProfileOnAnalysis(data.inferredProfile)
      }

      data.items.forEach((item: ClothingItem) => searchForItem(item))
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  function validateAndUpload(file: File) {
    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type) || file.size > 5 * 1024 * 1024) return
    handleImageUpload(file)
  }

  function handleHomeFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) validateAndUpload(file)
  }

  function handleHomeDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setHomeDragging(true)
  }

  function handleHomeDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setHomeDragging(false)
  }

  function handleHomeDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setHomeDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndUpload(file)
  }

  function handleAddToLook(itemId: string, product: Product) {
    const key = `${itemId}__${product.link}`
    setSelectedItems((prev) => {
      let updated: SelectedItems

      if (prev[key]) {
        updated = { ...prev }
        delete updated[key]
      } else {
        updateProfileOnSelection(product)
        updated = { ...prev, [key]: product }
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
      }
    } catch {
      setCoherenceScore(null)
    } finally {
      setIsScoringOutfit(false)
    }
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
    resetColorOnDom()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>

      {/* ── Navbar ── */}
      {!isHome && (
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: scrolled ? "rgba(10,10,10,0.85)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          <div className="flex items-center justify-between px-4 md:px-8 lg:px-12"
            style={{ height: "56px", maxWidth: "1280px", margin: "0 auto" }}>
            <button
              onClick={handleReset}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-serif)",
                fontSize: "22px",
                color: "white",
                letterSpacing: "-0.5px",
                padding: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              IRL
            </button>

            {selectedCount > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-1.5 rounded-full text-white transition-all duration-150"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 500,
                  fontSize: "12px",
                  padding: "6px 12px",
                  WebkitTapHighlightColor: "transparent",
                  minHeight: "36px",
                }}
              >
                Look ({selectedCount})
              </button>
            )}
          </div>
        </nav>
      )}

      {/* ── STATE A: Home Screen ── */}
      {isHome && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleHomeDragOver}
          onDragLeave={handleHomeDragLeave}
          onDrop={handleHomeDrop}
          onMouseEnter={() => setHomeHover(true)}
          onMouseLeave={() => setHomeHover(false)}
          style={{
            position: "relative",
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            cursor: "pointer",
            background: "#0a0a0a",
            boxShadow: homeDragging ? "inset 0 0 80px rgba(255,255,255,0.08)" : "none",
            transition: "box-shadow 0.3s ease",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {/* Background video */}
          <video
            ref={(el) => {
              if (!el) return
              el.defaultMuted = true
              el.muted = true
              el.play().catch(() => {})
            }}
            autoPlay
            loop
            playsInline
            preload="auto"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <source src="/home-bg.mp4" type="video/mp4" />
          </video>

          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: homeHover ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.65)",
              transition: "background 0.4s ease",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          {/* Top-left wordmark */}
          <div
            style={{
              position: "fixed",
              top: "16px",
              left: "16px",
              zIndex: 22,
              fontFamily: "var(--font-serif)",
              fontSize: "14px",
              color: "white",
              letterSpacing: "-0.3px",
              fontWeight: 400,
              pointerEvents: "none",
            }}
          >
            InRealLife
          </div>

          {/* Giant background text — mobile-first font size */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(80px, 20vw, 280px)",
              color: "rgba(255,255,255,0.07)",
              whiteSpace: "nowrap",
              lineHeight: 1,
              animation: "drift 40s linear infinite alternate",
              animationFillMode: "both",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: 2,
            }}
          >
            InRealLife
          </div>

          {/* Crosshair + label */}
          <div
            style={{
              position: "absolute",
              top: "75%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 12,
              pointerEvents: "none",
            }}
          >
            <div style={{ animation: "pulse-crosshair 3s ease-in-out infinite" }}>
              {/* Responsive crosshair via CSS class */}
              <svg className="w-[52px] h-[52px] md:w-[64px] md:h-[64px] lg:w-[72px] lg:h-[72px]" viewBox="0 0 72 72" fill="none">
                <line x1="36" y1="0" x2="36" y2="72" stroke="white" strokeWidth="1"
                  strokeOpacity={homeHover ? "1" : "0.9"} style={{ transition: "stroke-opacity 0.3s ease" }} />
                <line x1="0" y1="36" x2="72" y2="36" stroke="white" strokeWidth="1"
                  strokeOpacity={homeHover ? "1" : "0.9"} style={{ transition: "stroke-opacity 0.3s ease" }} />
                <circle cx="36" cy="36" r="3" fill="white" fillOpacity="0.9" />
              </svg>
            </div>

            <p
              className="text-xs md:text-sm"
              style={{
                marginTop: "14px",
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
                color: homeHover ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                letterSpacing: "0.5px",
                textAlign: "center",
                transition: "color 0.3s ease",
              }}
            >
              drop your fit bish
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleHomeFileChange}
            onClick={(e) => e.stopPropagation()}
            style={{ display: "none" }}
          />
        </div>
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
              className="px-4 md:px-6 lg:px-8 xl:px-12 pt-16 md:pt-20 pb-8 md:pb-10 lg:pb-12 xl:pb-16"
              style={{ maxWidth: "1280px", margin: "0 auto" }}
            >
              {/* Two-column on lg+, single column below */}
              <div className="flex flex-col lg:flex-row lg:gap-0 lg:items-start">

                {/* Left column — full width mobile, sticky 36% on lg+ */}
                <div className="w-full lg:w-[36%] xl:w-[38%] lg:sticky lg:top-[72px] lg:self-start lg:pr-8 xl:pr-12 mb-6 md:mb-8 lg:mb-0">

                  {/* Image */}
                  <div
                    className="rounded-xl md:rounded-[14px] lg:rounded-2xl overflow-hidden"
                    style={{ background: "#111", boxShadow: "0 24px 56px rgba(0,0,0,0.6)" }}
                  >
                    <img
                      src={uploadedImage}
                      alt="Your outfit"
                      className="w-full block object-contain"
                      style={{ maxHeight: "60vw", height: "auto" }}
                    />
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between mt-3 md:mt-4">
                    <span
                      className="inline-flex items-center rounded-full uppercase"
                      style={{
                        padding: "5px 12px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 500,
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.5)",
                        letterSpacing: "0.8px",
                      }}
                    >
                      {clothingItems.length} items found
                    </span>
                    <button
                      onClick={handleReset}
                      className="text-xs md:text-sm"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.3)",
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: "color 0.15s ease",
                        WebkitTapHighlightColor: "transparent",
                        minHeight: "44px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)" }}
                    >
                      Upload new ↑
                    </button>
                  </div>
                </div>

                {/* Right column */}
                <div className="w-full lg:w-[64%] xl:w-[62%] lg:pt-1">
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
                          onClick={() => setCartOpen(true)}
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
                          onClick={() => setCartOpen(true)}
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
        onRemove={handleRemoveFromLook}
        coherenceScore={coherenceScore}
        isScoringOutfit={isScoringOutfit}
      />
    </div>
  )
}
