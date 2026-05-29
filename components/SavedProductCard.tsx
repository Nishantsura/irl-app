"use client"

import { useState } from "react"
import { SavedProduct } from "@/types"

interface Props {
  savedProduct: SavedProduct
  onUnsave: (link: string) => void
}

export default function SavedProductCard({ savedProduct, onUnsave }: Props) {
  const { product, category } = savedProduct
  const [imgError, setImgError] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  function handleUnsave() {
    setIsLeaving(true)
    setTimeout(() => onUnsave(product.link), 250)
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        overflow: "hidden",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        opacity: isLeaving ? 0 : 1,
        transform: isLeaving ? "scale(0.95)" : "scale(1)",
      }}
    >
      {/* Product image — square aspect ratio */}
      <div style={{ width: "100%", aspectRatio: "1/1", background: "#1e1e1e", overflow: "hidden" }}>
        {!imgError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        <p style={{
          fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: "9px",
          color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px",
          textTransform: "uppercase", marginBottom: "3px",
        }}>
          {category}
        </p>
        <p style={{
          fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "13px",
          color: "white", marginBottom: "2px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {product.brand}
        </p>
        <p style={{
          fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: "16px",
          color: "white", marginBottom: "10px",
        }}>
          {product.priceFormatted}
        </p>

        {/* Action row */}
        <div className="flex gap-1.5">
          {/* Buy button */}
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center transition-all duration-150"
            style={{
              height: "34px", borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "12px",
              color: "white", textDecoration: "none",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.1)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent" }}
          >
            Buy →
          </a>

          {/* Unsave button */}
          <button
            onClick={handleUnsave}
            className="flex items-center justify-center transition-all duration-150"
            style={{
              width: "34px", height: "34px", flexShrink: 0, borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
              cursor: "pointer", color: "rgba(255,255,255,0.4)",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = "rgba(255,255,255,0.8)"
              el.style.borderColor = "rgba(255,255,255,0.25)"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = "rgba(255,255,255,0.4)"
              el.style.borderColor = "rgba(255,255,255,0.1)"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
