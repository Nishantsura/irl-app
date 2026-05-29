"use client"

import { useState } from "react"
import { Product } from "@/types"

interface Props {
  product: Product
  isSelected: boolean
  onAdd: () => void
  animationDelay?: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="11" height="11"
          fill={star <= Math.round(rating) ? "#fbbf24" : "rgba(255,255,255,0.15)"}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProductCard({ product, isSelected, onAdd, animationDelay = 0 }: Props) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="card-enter flex-shrink-0 cursor-pointer"
      style={{
        width: "180px",
        borderRadius: "14px",
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
      <div style={{ width: "100%", height: "180px", background: "#1e1e1e", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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

      {/* Body */}
      <div style={{ padding: "12px" }}>
        <p style={{
          fontFamily: "var(--font-dm-sans)",
          fontWeight: 600,
          fontSize: "10px",
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: "4px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {product.brand}
        </p>

        <p style={{
          fontFamily: "var(--font-dm-sans)",
          fontWeight: 600,
          fontSize: "18px",
          color: "white",
          marginBottom: "6px",
          lineHeight: 1.1,
        }}>
          {product.priceFormatted}
        </p>

        <div style={{ marginBottom: "10px" }}>
          {product.rating > 0 ? (
            <div className="flex items-center gap-1.5">
              <StarRating rating={product.rating} />
              <span style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 400,
                fontSize: "12px",
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
              fontSize: "12px",
              color: "rgba(255,255,255,0.25)",
            }}>
              No ratings
            </span>
          )}
        </div>

        {/* Action row: Add to Look + View product */}
        <button
          onClick={onAdd}
          className="w-full transition-all duration-150"
          style={{
            height: "36px",
            borderRadius: "8px",
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 500,
            fontSize: "13px",
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

        {/* View product link — opens retailer page in new tab */}
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "block",
            marginTop: "8px",
            textAlign: "center",
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 400,
            fontSize: "12px",
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
