"use client"

import { useState } from "react"
import { Product } from "@/types"

interface Props {
  product: Product
  isSelected: boolean
  onAdd: () => void
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${star <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProductCard({ product, isSelected, onAdd }: Props) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className={`
      flex-shrink-0 w-44 rounded-xl border bg-white overflow-hidden transition-all duration-200
      hover:shadow-md hover:-translate-y-0.5
      ${isSelected ? "border-black ring-2 ring-black ring-offset-1" : "border-gray-200"}
    `}>
      <div className="relative w-full h-44 bg-gray-100">
        {!imgError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">
          {product.brand}
        </p>

        <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </p>

        <p className="text-base font-bold text-black">{product.priceFormatted}</p>

        <div className="flex items-center gap-1.5">
          {product.rating > 0 ? (
            <>
              <StarRating rating={product.rating} />
              <span className="text-xs text-gray-500">
                {product.rating.toFixed(1)}
                {product.reviewCount > 0 && (
                  <span className="text-gray-400"> ({product.reviewCount})</span>
                )}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400">No ratings yet</span>
          )}
        </div>

        <button
          onClick={onAdd}
          className={`
            mt-1 w-full py-2 rounded-lg text-sm font-semibold transition-all duration-150
            ${isSelected
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-black text-white hover:bg-gray-800"
            }
          `}
        >
          {isSelected ? "✓ Added" : "Add to Look"}
        </button>
      </div>
    </div>
  )
}
