"use client"

import { ClothingItem, Product, ProductResults, SearchingState, SelectedItems } from "@/types"
import ProductCard from "./ProductCard"

interface Props {
  clothingItems: ClothingItem[]
  productResults: ProductResults
  searchingItems: SearchingState
  selectedItems: SelectedItems
  onAddToLook: (itemId: string, product: Product) => void
}

function SkeletonCard() {
  return (
    <div
      className="flex-shrink-0 animate-pulse"
      style={{
        width: "180px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.03)",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", height: "180px", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ padding: "12px" }}>
        <div style={{ height: "10px", width: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "10px" }} />
        <div style={{ height: "20px", width: "80px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "8px" }} />
        <div style={{ height: "10px", width: "100px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "12px" }} />
        <div style={{ height: "36px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }} />
      </div>
    </div>
  )
}

export default function OutfitBreakdown({ clothingItems, productResults, searchingItems, selectedItems, onAddToLook }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {clothingItems.map((item, index) => {
        const products = productResults[item.id]
        const isSearching = searchingItems[item.id]
        const isLast = index === clothingItems.length - 1

        return (
          <div
            key={item.id}
            className="section-enter"
            style={{
              animationDelay: `${index * 0.1}s`,
              opacity: 0,
              paddingBottom: isLast ? 0 : "32px",
              marginBottom: isLast ? 0 : "32px",
              borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Section header */}
            <div style={{ marginBottom: "20px" }}>
              <p style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 600,
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}>
                {item.category}
              </p>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontSize: "22px",
                color: "white",
                letterSpacing: "-0.3px",
                lineHeight: 1.3,
              }}>
                {item.description}
              </p>
            </div>

            {/* Cards row */}
            <div
              className="scroll-x"
              style={{ display: "flex", gap: "12px", paddingBottom: "8px" }}
            >
              {isSearching ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : products && products.length > 0 ? (
                products.map((product, cardIndex) => (
                  <ProductCard
                    key={cardIndex}
                    product={product}
                    isSelected={!!selectedItems[`${item.id}__${product.link}`]}
                    onAdd={() => onAddToLook(item.id, product)}
                    animationDelay={cardIndex * 0.06}
                  />
                ))
              ) : (
                <div style={{ padding: "16px 0" }}>
                  <p style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: "6px",
                  }}>
                    No matches found for this item.
                  </p>
                  <a
                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.searchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.5)",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    Search manually on Google Shopping →
                  </a>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
