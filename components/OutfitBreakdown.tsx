"use client"

import { useEffect, useRef } from "react"
import { ClothingItem, Product, ProductResults, SearchingState, SelectedItems } from "@/types"
import ProductCard from "./ProductCard"
import { track } from "@/lib/analytics"

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
      className="flex-shrink-0 animate-pulse min-w-[148px] w-[148px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] rounded-xl md:rounded-[14px]"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.03)",
        overflow: "hidden",
      }}
    >
      <div className="w-full h-[148px] md:h-[160px] lg:h-[180px]" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="p-2.5 md:p-3">
        <div style={{ height: "10px", width: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "10px" }} />
        <div style={{ height: "20px", width: "80px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "8px" }} />
        <div style={{ height: "10px", width: "100px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "12px" }} />
        <div style={{ height: "32px", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }} />
      </div>
    </div>
  )
}

function SectionWrapper({
  item,
  index,
  isLast,
  children,
  fired,
  onFired,
}: {
  item: ClothingItem
  index: number
  isLast: boolean
  children: React.ReactNode
  fired: React.MutableRefObject<Set<string>>
  onFired: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current.has(item.id)) {
          fired.current.add(item.id)
          track("clothing_section_viewed", { category: item.category, position: index })
          onFired()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [item.id, item.category, index, fired, onFired])

  return (
    <div
      ref={ref}
      className={`section-enter${!isLast ? " mb-8 md:mb-10 lg:mb-12 pb-8 md:pb-10 lg:pb-12" : ""}`}
      style={{
        animationDelay: `${index * 0.1}s`,
        opacity: 0,
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  )
}

export default function OutfitBreakdown({ clothingItems, productResults, searchingItems, selectedItems, onAddToLook }: Props) {
  const firedSections = useRef<Set<string>>(new Set())

  // Reset fired set when clothing items change (new analysis)
  useEffect(() => {
    firedSections.current = new Set()
  }, [clothingItems])

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {clothingItems.map((item, index) => {
        const products = productResults[item.id]
        const isSearching = searchingItems[item.id]
        const isLast = index === clothingItems.length - 1

        return (
          <SectionWrapper
            key={item.id}
            item={item}
            index={index}
            isLast={isLast}
            fired={firedSections}
            onFired={() => {}}
          >
            {/* Section header */}
            <div className="mb-4 md:mb-5">
              <p
                className="text-[10px] md:text-[11px]"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                {item.category}
              </p>
              <p
                className="text-lg md:text-xl lg:text-2xl"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "white",
                  letterSpacing: "-0.3px",
                  lineHeight: 1.3,
                }}
              >
                {item.description}
              </p>
            </div>

            {/* Cards row */}
            <div
              className="scroll-x gap-2 md:gap-3"
              style={{ display: "flex", paddingBottom: "8px" }}
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
                    clothingCategory={item.category}
                    clothingDescription={item.description}
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
          </SectionWrapper>
        )
      })}
    </div>
  )
}
