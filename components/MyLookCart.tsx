"use client"

import { useState } from "react"
import { ClothingItem, Product, SelectedItems, CoherenceScore } from "@/types"
import { saveLook, getSavedLooks } from "@/lib/savedItems"

interface Props {
  open: boolean
  onClose: () => void
  selectedItems: SelectedItems
  clothingItems: ClothingItem[]
  totalFormatted: string
  totalPrice: number
  onRemove: (itemId: string) => void
  coherenceScore: CoherenceScore | null
  isScoringOutfit: boolean
  uploadedImage: string | null
  onLookSaved: () => void
}

export default function MyLookCart({
  open, onClose, selectedItems, clothingItems, totalFormatted, totalPrice,
  onRemove, coherenceScore, isScoringOutfit, uploadedImage, onLookSaved
}: Props) {
  const selectedCount = Object.keys(selectedItems).length
  const [lookSaveState, setLookSaveState] = useState<"idle" | "saving" | "saved" | "full">("idle")

  function getCategoryForId(key: string): string {
    const itemId = key.split("__")[0]
    const item = clothingItems.find((c) => c.id === itemId)
    return item ? item.category : "item"
  }

  async function handleSaveLook() {
    if (!uploadedImage || lookSaveState !== "idle") return

    // Check limit before saving
    const existing = getSavedLooks()
    if (existing.length >= 20) {
      setLookSaveState("full")
      return
    }

    setLookSaveState("saving")

    const success = await saveLook(
      uploadedImage,
      selectedItems,
      clothingItems,
      totalPrice,
      coherenceScore
    )

    if (success) {
      setLookSaveState("saved")
      onLookSaved()
      setTimeout(() => setLookSaveState("idle"), 2000)
    } else {
      setLookSaveState("full")
    }
  }

  function SaveLookButton() {
    const isDisabled = lookSaveState === "saving" || lookSaveState === "full"
    const isFull = lookSaveState === "full"
    const isSaved = lookSaveState === "saved"
    const isSaving = lookSaveState === "saving"

    return (
      <button
        onClick={handleSaveLook}
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-2 transition-all duration-200"
        style={{
          height: "44px",
          borderRadius: "10px",
          border: isSaved
            ? "1px solid rgba(255,255,255,0.4)"
            : "1px solid rgba(255,255,255,0.2)",
          background: "transparent",
          fontFamily: "var(--font-dm-sans)",
          fontWeight: 500,
          fontSize: "13px",
          color: "white",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isFull ? 0.4 : 1,
          marginBottom: "16px",
          WebkitTapHighlightColor: "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent"
        }}
      >
        {isSaving ? (
          <>
            <div style={{
              width: "12px", height: "12px", borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.2)",
              borderTop: "1.5px solid rgba(255,255,255,0.7)",
              animation: "spin 0.8s linear infinite",
            }} />
            Saving...
          </>
        ) : isSaved ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Look Saved ✓
          </>
        ) : isFull ? (
          "Saves full (20/20)"
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Save this Look
          </>
        )}
      </button>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 99,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Cart panel */}
      <div
        className="w-full md:w-[380px] lg:w-[400px]"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          background: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div className="px-4 pt-5 md:px-6 md:pt-6">
          <div className="flex items-center justify-between">
            <h2
              className="text-2xl md:text-[28px]"
              style={{
                fontFamily: "var(--font-serif)",
                color: "white",
                letterSpacing: "-0.5px",
              }}
            >
              My Look
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                fontSize: "24px",
                lineHeight: 1,
                padding: "4px",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "white" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)" }}
            >
              ×
            </button>
          </div>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", marginTop: "20px" }} />
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6">
          {selectedCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "rgba(255,255,255,0.4)" }}>
                Your look is empty
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
                Add items from your outfit
              </p>
            </div>
          ) : (
            <div style={{ paddingTop: "20px" }}>
              {Object.entries(selectedItems).map(([itemId, product]: [string, Product], index) => (
                <div key={itemId}>
                  {index > 0 && (
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                  )}
                  <div>
                    {/* Row: thumb + info + remove */}
                    <div className="flex gap-3 items-start">
                      <div
                        className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0"
                        style={{ borderRadius: "8px", overflow: "hidden", background: "#1e1e1e" }}
                      >
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="24" height="24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, paddingLeft: "4px" }}>
                        <p style={{
                          fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: "10px",
                          color: "rgba(255,255,255,0.4)", letterSpacing: "1px",
                          textTransform: "uppercase", marginBottom: "2px",
                        }}>
                          {getCategoryForId(itemId)}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "14px",
                          color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {product.brand}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: "16px",
                          color: "white", marginTop: "2px",
                        }}>
                          {product.priceFormatted}
                        </p>
                      </div>

                      <button
                        onClick={() => onRemove(itemId)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "rgba(255,255,255,0.25)", fontSize: "18px", lineHeight: 1,
                          padding: "4px", flexShrink: 0, transition: "color 0.15s ease",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)" }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Buy button */}
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-9 md:h-10 text-xs md:text-[13px]"
                      style={{
                        marginTop: "10px", borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
                        fontFamily: "var(--font-dm-sans)", fontWeight: 500,
                        color: "white", textDecoration: "none", transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent" }}
                    >
                      Buy on {product.source} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedCount > 0 && (
          <div
            className="px-4 py-4 md:px-6 md:py-5"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(10,10,10,0.95)",
            }}
          >
            {/* Coherence Score block */}
            {selectedCount >= 2 && (
              <div style={{ marginBottom: "16px" }}>
                {isScoringOutfit ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "14px", height: "14px", borderRadius: "50%",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      borderTop: "1.5px solid rgba(255,255,255,0.5)",
                      animation: "spin 0.8s linear infinite", flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: "var(--font-dm-sans)", fontWeight: 400,
                      fontSize: "12px", color: "rgba(255,255,255,0.35)",
                    }}>
                      Styling your look...
                    </span>
                  </div>
                ) : coherenceScore ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                        <span
                          className="text-3xl md:text-[32px]"
                          style={{ fontFamily: "var(--font-serif)", color: "white", lineHeight: 1 }}
                        >
                          {coherenceScore.score.toFixed(1)}
                        </span>
                        <span style={{
                          fontFamily: "var(--font-dm-sans)", fontWeight: 300,
                          fontSize: "14px", color: "rgba(255,255,255,0.35)", paddingBottom: "3px",
                        }}>
                          /10
                        </span>
                      </div>
                      <span style={{
                        fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "12px",
                        color: "white", letterSpacing: "0.3px",
                        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "999px", padding: "4px 12px",
                      }}>
                        {coherenceScore.style}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: "var(--font-dm-sans)", fontWeight: 300,
                      fontSize: "12px", color: "rgba(255,255,255,0.35)",
                      fontStyle: "italic", marginTop: "4px",
                    }}>
                      {coherenceScore.colorStory}
                    </p>
                    <div style={{ borderLeft: "2px solid rgba(255,255,255,0.15)", paddingLeft: "10px", marginTop: "12px" }}>
                      <p style={{
                        fontFamily: "var(--font-dm-sans)", fontWeight: 400,
                        fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5,
                      }}>
                        {coherenceScore.tip}
                      </p>
                    </div>
                  </div>
                ) : null}

                {(isScoringOutfit || coherenceScore) && (
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                )}
              </div>
            )}

            {/* Save this Look button */}
            <SaveLookButton />

            {/* Estimated Total */}
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontWeight: 400, fontSize: "13px",
              color: "rgba(255,255,255,0.4)", letterSpacing: "1px",
              textTransform: "uppercase", marginBottom: "4px",
            }}>
              Estimated Total
            </p>
            <p
              className="text-3xl md:text-4xl"
              style={{ fontFamily: "var(--font-serif)", color: "white", letterSpacing: "-1px", lineHeight: 1.1 }}
            >
              {totalFormatted}
            </p>
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontWeight: 400, fontSize: "11px",
              color: "rgba(255,255,255,0.25)", marginTop: "6px",
            }}>
              Final prices on retailer site
            </p>
          </div>
        )}
      </div>
    </>
  )
}
