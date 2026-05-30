"use client"

import { useState } from "react"
import { Product } from "@/types"
import { isProductSaved, toggleSaveProduct } from "@/lib/savedItems"
import { track } from "@/lib/analytics"

interface Props {
  product: Product
  isSelected: boolean
  onAdd: () => void
  animationDelay?: number
  clothingCategory: string
  clothingDescription: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="10" height="10"
          fill={star <= Math.round(rating) ? "#fbbf24" : "rgba(255,255,255,0.15)"}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProductCard({ product, isSelected, onAdd, animationDelay = 0, clothingCategory, clothingDescription }: Props) {
  const [imgError, setImgError] = useState(false)
  const [isSaved, setIsSaved] = useState(() => isProductSaved(product.link))

  function handleBookmark(e: React.MouseEvent) {
    e.stopPropagation()
    const nowSaved = toggleSaveProduct(product, clothingCategory, clothingDescription)
    setIsSaved(nowSaved)
    if (nowSaved) {
      track("product_saved", {
        category: clothingCategory,
        brand: product.source,
        price: product.price,
        price_formatted: product.priceFormatted,
      })
    } else {
      track("product_unsaved", {
        category: clothingCategory,
        brand: product.source,
        price: product.price,
      })
    }
  }

  return (
    <div
      className="card-enter cursor-pointer min-w-[148px] w-[148px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] flex-shrink-0 rounded-xl md:rounded-[14px]"
      style={{
        border: isSelected
          ? "1px solid rgba(255,255,255,0.7)"
          : "1px solid rgba(255,255,255,0.08)",
        background: isSelected
          ? "rgba(255,255,255,0.1)"
          : "rgba(255,255,255,0.05)",
        overflow: "hidden",
        transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
        animationDelay: `${animationDelay}s`,
        opacity: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = "translateY(-4px)"
        if (!isSelected) {
          el.style.borderColor = "rgba(255,255,255,0.2)"
          el.style.background = "rgba(255,255,255,0.08)"
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = "translateY(0)"
        if (!isSelected) {
          el.style.borderColor = "rgba(255,255,255,0.08)"
          el.style.background = "rgba(255,255,255,0.05)"
        }
      }}
    >
      {/* Image */}
      <div
        className="w-full h-[148px] md:h-[160px] lg:h-[180px] relative"
        style={{ background: "#1e1e1e", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
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

        {/* Bookmark button — top-right corner of image */}
        <button
          onClick={handleBookmark}
          className="absolute top-2 right-2 flex items-center justify-center backdrop-blur-sm transition-all duration-150"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: isSaved ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.5)",
            border: "none",
            cursor: "pointer",
            zIndex: 10,
            color: "white",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = isSaved ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.7)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = isSaved ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.5)"
          }}
        >
          {isSaved ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="p-2.5 md:p-3">
        <p
          className="text-[9px] md:text-[10px]"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 600,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            marginBottom: "4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.brand}
        </p>

        <p
          className="text-base md:text-lg"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 600,
            color: "white",
            marginBottom: "6px",
            lineHeight: 1.1,
          }}
        >
          {product.priceFormatted}
        </p>

        <div style={{ marginBottom: "8px" }}>
          {product.rating > 0 ? (
            <div className="flex items-center gap-1">
              <StarRating rating={product.rating} />
              <span style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 400,
                fontSize: "11px",
                color: "rgba(255,255,255,0.5)",
              }}>
                {product.rating.toFixed(1)}
                {product.reviewCount > 0 && (
                  <span style={{ color: "rgba(255,255,255,0.3)" }}> ({product.reviewCount})</span>
                )}
              </span>
            </div>
          ) : (
            <span style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 400,
              fontSize: "11px",
              color: "rgba(255,255,255,0.25)",
            }}>
              No ratings
            </span>
          )}
        </div>

        {/* Add to Look button */}
        <button
          onClick={onAdd}
          className="w-full transition-all duration-150 h-8 text-xs rounded-md md:h-9 md:text-[13px] md:rounded-lg"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 500,
            cursor: "pointer",
            background: isSelected ? "white" : "rgba(255,255,255,0.1)",
            color: isSelected ? "#0a0a0a" : "white",
            border: isSelected ? "1px solid white" : "1px solid rgba(255,255,255,0.15)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            if (!isSelected) el.style.background = "rgba(255,255,255,0.18)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            if (!isSelected) el.style.background = "rgba(255,255,255,0.1)"
          }}
        >
          {isSelected ? "✓ Added" : "Add to Look"}
        </button>

        {/* View product link */}
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "block",
            marginTop: "7px",
            textAlign: "center",
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 400,
            fontSize: "11px",
            color: "rgba(255,255,255,0.3)",
            textDecoration: "none",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.65)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.3)" }}
        >
          View product ↗
        </a>
      </div>
    </div>
  )
}
