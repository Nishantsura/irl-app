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
    <div className="flex-shrink-0 w-44 rounded-xl border border-gray-100 bg-white overflow-hidden animate-pulse">
      <div className="w-full h-44 bg-gray-200" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-200 rounded-lg w-full mt-1" />
      </div>
    </div>
  )
}

export default function OutfitBreakdown({ clothingItems, productResults, searchingItems, selectedItems, onAddToLook }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {clothingItems.map((item) => {
        const products = productResults[item.id]
        const isSearching = searchingItems[item.id]

        return (
          <div key={item.id}>
            <div className="mb-3">
              <span className="inline-block px-2.5 py-0.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full mb-1.5">
                {item.category}
              </span>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {isSearching ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : products && products.length > 0 ? (
                products.map((product, idx) => (
                  <ProductCard
                    key={idx}
                    product={product}
                    isSelected={selectedItems[item.id]?.link === product.link}
                    onAdd={() => onAddToLook(item.id, product)}
                  />
                ))
              ) : (
                <div className="py-4 text-sm text-gray-400">
                  <p className="mb-1">No matches found for this item.</p>
                  <a
                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.searchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black underline underline-offset-2 hover:text-gray-600 transition-colors"
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
