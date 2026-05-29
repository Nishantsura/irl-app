"use client"

import { ClothingItem, Product, SelectedItems, CoherenceScore } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  selectedItems: SelectedItems
  clothingItems: ClothingItem[]
  totalFormatted: string
  onRemove: (itemId: string) => void
  coherenceScore: CoherenceScore | null
  isScoringOutfit: boolean
}

export default function MyLookCart({ open, onClose, selectedItems, clothingItems, totalFormatted, onRemove, coherenceScore, isScoringOutfit }: Props) {
  const selectedCount = Object.keys(selectedItems).length

  function getCategoryForId(key: string): string {
    // Key is composite: "${itemId}__${productLink}" — extract the itemId part
    const itemId = key.split("__")[0]
    const item = clothingItems.find((c) => c.id === itemId)
    return item ? item.category : "item"
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
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(400px, 100vw)",
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
        <div style={{ padding: "24px 24px 0" }}>
          <div className="flex items-center justify-between">
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "28px",
              color: "white",
              letterSpacing: "-0.5px",
            }}>
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
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
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
                      <div style={{
                        width: "64px",
                        height: "64px",
                        flexShrink: 0,
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "#1e1e1e",
                      }}>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
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
                          fontFamily: "var(--font-dm-sans)",
                          fontWeight: 600,
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.4)",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          marginBottom: "2px",
                        }}>
                          {getCategoryForId(itemId)}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontWeight: 500,
                          fontSize: "14px",
                          color: "white",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {product.brand}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontWeight: 600,
                          fontSize: "16px",
                          color: "white",
                          marginTop: "2px",
                        }}>
                          {product.priceFormatted}
                        </p>
                      </div>

                      <button
                        onClick={() => onRemove(itemId)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(255,255,255,0.25)",
                          fontSize: "18px",
                          lineHeight: 1,
                          padding: "4px",
                          flexShrink: 0,
                          transition: "color 0.15s ease",
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
                      className="flex items-center justify-center transition-all duration-150 hover:bg-white/10"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "40px",
                        marginTop: "10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "transparent",
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 500,
                        fontSize: "13px",
                        color: "white",
                        textDecoration: "none",
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
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "20px 24px",
            background: "rgba(10,10,10,0.95)",
          }}>

            {/* Coherence Score block — only when 2+ items selected */}
            {selectedCount >= 2 && (
              <div style={{ marginBottom: "16px" }}>
                {isScoringOutfit ? (
                  /* Loading state — subtle, non-blocking */
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      borderTop: "1.5px solid rgba(255,255,255,0.5)",
                      animation: "spin 0.8s linear infinite",
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 400,
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.35)",
                    }}>
                      Styling your look...
                    </span>
                  </div>
                ) : coherenceScore ? (
                  /* Score loaded */
                  <div>
                    {/* Top row: score number + style label */}
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                        <span style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "32px",
                          color: "white",
                          lineHeight: 1,
                        }}>
                          {coherenceScore.score.toFixed(1)}
                        </span>
                        <span style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontWeight: 300,
                          fontSize: "14px",
                          color: "rgba(255,255,255,0.35)",
                          paddingBottom: "3px",
                        }}>
                          /10
                        </span>
                      </div>
                      <span style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 500,
                        fontSize: "12px",
                        color: "white",
                        letterSpacing: "0.3px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "999px",
                        padding: "4px 12px",
                      }}>
                        {coherenceScore.style}
                      </span>
                    </div>

                    {/* Color story */}
                    <p style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 300,
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.35)",
                      fontStyle: "italic",
                      marginTop: "4px",
                    }}>
                      {coherenceScore.colorStory}
                    </p>

                    {/* Tip */}
                    <div style={{
                      borderLeft: "2px solid rgba(255,255,255,0.15)",
                      paddingLeft: "10px",
                      marginTop: "12px",
                    }}>
                      <p style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 400,
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.5,
                      }}>
                        {coherenceScore.tip}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Divider between score block and total */}
                {(isScoringOutfit || coherenceScore) && (
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                )}
              </div>
            )}

            {/* Estimated Total */}
            <p style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 400,
              fontSize: "13px",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}>
              Estimated Total
            </p>
            <p style={{
              fontFamily: "var(--font-serif)",
              fontSize: "36px",
              color: "white",
              letterSpacing: "-1px",
              lineHeight: 1.1,
            }}>
              {totalFormatted}
            </p>
            <p style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 400,
              fontSize: "11px",
              color: "rgba(255,255,255,0.25)",
              marginTop: "6px",
            }}>
              Final prices on retailer site
            </p>
          </div>
        )}
      </div>
    </>
  )
}
