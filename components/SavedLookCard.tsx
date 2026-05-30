"use client"

import { useState } from "react"
import { SavedLook } from "@/types"
import { track } from "@/lib/analytics"

interface Props {
  savedLook: SavedLook
  onDelete: (id: string) => void
}

function formatSavedDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  })
}

export default function SavedLookCard({ savedLook, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [imgError, setImgError] = useState(false)

  const MAX_PREVIEW = 5
  const previewProducts = savedLook.selectedProducts.slice(0, MAX_PREVIEW)
  const extraCount = savedLook.selectedProducts.length - MAX_PREVIEW

  function handleDelete() {
    setIsLeaving(true)
    setTimeout(() => onDelete(savedLook.id), 300)
  }

  function handleBuyAll() {
    savedLook.selectedProducts.forEach((item, i) => {
      setTimeout(() => {
        window.open(item.product.link, "_blank", "noopener,noreferrer")
      }, i * 300)
    })
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        overflow: "hidden",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        opacity: isLeaving ? 0 : 1,
        transform: isLeaving ? "translateY(-8px)" : "translateY(0)",
      }}
    >
      {/* Main card row */}
      <div className="flex flex-col md:flex-row">
        {/* Outfit image */}
        <div
          className="w-full md:w-[180px] md:flex-shrink-0"
          style={{ height: "180px", background: "#1a1a1a", overflow: "hidden" }}
        >
          {!imgError && savedLook.outfitImageCompressed ? (
            <img
              src={savedLook.outfitImageCompressed}
              alt="Saved outfit"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="36" height="36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Look details */}
        <div
          className="flex-1 cursor-pointer"
          style={{ padding: "16px 20px" }}
          onClick={() => {
            const next = !expanded
            setExpanded(next)
            if (next) {
              const daysSince = Math.floor(
                (Date.now() - new Date(savedLook.savedAt).getTime()) / 86400000
              )
              track("saved_look_opened", {
                items_count: savedLook.itemCount,
                total_value: savedLook.totalPrice,
                days_since_saved: daysSince,
                score: savedLook.coherenceScore?.score ?? null,
              })
            }
          }}
        >
          {/* Top row: style + score */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              {savedLook.coherenceScore && (
                <span style={{
                  display: "inline-block",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "11px",
                  color: "white", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "999px", padding: "3px 10px", marginBottom: "6px",
                }}>
                  {savedLook.coherenceScore.style}
                </span>
              )}
              <p style={{
                fontFamily: "var(--font-dm-sans)", fontWeight: 400, fontSize: "12px",
                color: "rgba(255,255,255,0.35)",
              }}>
                {savedLook.itemCount} {savedLook.itemCount === 1 ? "piece" : "pieces"}
              </p>
            </div>

            {savedLook.coherenceScore && (
              <div className="flex-shrink-0 text-right">
                <span style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "white", lineHeight: 1 }}>
                  {savedLook.coherenceScore.score.toFixed(1)}
                </span>
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
                  /10
                </span>
              </div>
            )}
          </div>

          {/* Total price */}
          <p
            className="text-[28px] md:text-[32px]"
            style={{
              fontFamily: "var(--font-serif)", color: "white",
              letterSpacing: "-0.5px", lineHeight: 1, marginTop: "8px",
            }}
          >
            {savedLook.totalFormatted}
          </p>

          {/* Date */}
          <p style={{
            fontFamily: "var(--font-dm-sans)", fontWeight: 400, fontSize: "12px",
            color: "rgba(255,255,255,0.3)", marginTop: "4px",
          }}>
            Saved {formatSavedDate(savedLook.savedAt)}
          </p>

          {/* Product thumbnails preview */}
          <div className="flex items-center gap-1.5 mt-4">
            {previewProducts.map((item, i) => (
              <div
                key={i}
                style={{
                  width: "40px", height: "40px", borderRadius: "6px",
                  overflow: "hidden", background: "#1e1e1e", flexShrink: 0,
                }}
              >
                {item.product.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.category}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.05)" }} />
                )}
              </div>
            ))}
            {extraCount > 0 && (
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: "40px", height: "40px", borderRadius: "6px",
                  background: "rgba(255,255,255,0.08)",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "11px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                +{extraCount}
              </div>
            )}

            {/* Expand indicator */}
            <div style={{ marginLeft: "auto" }}>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.3)" strokeWidth="2"
                style={{ transition: "transform 0.2s ease", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Bottom action row */}
          <div
            className="flex items-center gap-3 mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Buy All button */}
            <button
              onClick={handleBuyAll}
              className="transition-all duration-150"
              style={{
                height: "34px", paddingInline: "16px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "12px",
                color: "white", cursor: "pointer", WebkitTapHighlightColor: "transparent",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
            >
              Buy All →
            </button>

            {/* Delete */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center transition-all duration-150"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.25)", padding: "4px",
                  WebkitTapHighlightColor: "transparent",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                }}>
                  Delete?
                </span>
                <button
                  onClick={handleDelete}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "12px",
                    color: "rgba(239,68,68,0.8)", padding: "2px 6px",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-dm-sans)", fontSize: "12px",
                    color: "rgba(255,255,255,0.4)", padding: "2px 6px",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded panel — individual products */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {savedLook.selectedProducts.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {/* Thumbnail */}
                <div style={{
                  width: "50px", height: "50px", flexShrink: 0,
                  borderRadius: "8px", overflow: "hidden", background: "#1e1e1e",
                }}>
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.category} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.05)" }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: "9px",
                    color: "rgba(255,255,255,0.4)", letterSpacing: "1.2px",
                    textTransform: "uppercase", marginBottom: "2px",
                  }}>
                    {item.category}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "13px",
                    color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {item.product.brand}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: "14px",
                    color: "white",
                  }}>
                    {item.product.priceFormatted}
                  </p>
                </div>

                {/* Buy link */}
                <a
                  href={item.product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 transition-all duration-150"
                  style={{
                    height: "32px", paddingInline: "12px",
                    borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)",
                    background: "transparent", display: "flex", alignItems: "center",
                    fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "12px",
                    color: "white", textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent" }}
                  onClick={() => track("buy_clicked", {
                    retailer: item.product.source,
                    category: item.category,
                    price: item.product.price,
                    price_formatted: item.product.priceFormatted,
                    source: "saved_looks",
                    look_total: savedLook.totalPrice,
                    items_in_look: savedLook.itemCount,
                  })}
                >
                  Buy on {item.product.source} →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
