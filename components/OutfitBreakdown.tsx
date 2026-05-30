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
      className="flex-shrink-0 animate-pulse min-w-[152px] w-[152px] md:min-w-[165px] md:w-[165px] lg:min-w-[180px] lg:w-[180px] rounded-xl"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.03)",
        overflow: "hidden",
      }}
    >
      <div className="w-full h-[152px] md:h-[165px] lg:h-[180px]" style={{ background: "rgba(255,255,255,0.05)" }} />
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
      className={`section-enter mb-8 lg:mb-10${index > 0 ? " pt-5 lg:pt-6 border-t border-white/[0.06]" : ""}`}
      style={{
        animationDelay: `${index * 0.1}s`,
        opacity: 0,
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
            <div className="mb-5 lg:mb-6">
              <p
                className="text-2xl lg:text-3xl"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "white",
                  letterSpacing: "-0.3px",
                  lineHeight: 1.15,
                  marginBottom: "6px",
                }}
              >
                {item.category}
              </p>
              <p
                className="text-sm lg:text-base"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {item.description}
              </p>
            </div>

            {/* Cards row */}
            <div
              className="scroll-x gap-2.5 lg:gap-3"
              style={{ display: "flex", paddingBottom: "8px", paddingRight: "4px", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
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
                <div style={{ margin: "8px 0" }}>
                  <p style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: "6px",
                  }}>
                    No matches found
                  </p>
                  <a
                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.searchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.25)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none" }}
                  >
                    Search on Google →
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
