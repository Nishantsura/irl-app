"use client"

import { ClothingItem, Product, SelectedItems } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  selectedItems: SelectedItems
  clothingItems: ClothingItem[]
  totalFormatted: string
  onRemove: (itemId: string) => void
}

export default function MyLookCart({ open, onClose, selectedItems, clothingItems, totalFormatted, onRemove }: Props) {
  const selectedCount = Object.keys(selectedItems).length

  function getCategoryForId(id: string): string {
    const item = clothingItems.find((c) => c.id === id)
    return item ? item.category : "item"
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${open ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">My Look</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Add items from your outfit to see them here</p>
            </div>
          ) : (
            <div className="px-5 py-4 flex flex-col gap-4">
              {Object.entries(selectedItems).map(([itemId, product]: [string, Product]) => (
                <div key={itemId} className="flex gap-3 items-start">
                  <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {getCategoryForId(itemId)}
                    </p>
                    <p className="text-sm font-medium text-gray-800 truncate">{product.brand}</p>
                    <p className="text-sm font-bold text-black">{product.priceFormatted}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <a
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-black underline underline-offset-2 hover:text-gray-600 transition-colors"
                      >
                        Buy on {product.source} →
                      </a>
                      <button
                        onClick={() => onRemove(itemId)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedCount > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Estimated Total</span>
            </div>
            <p className="text-2xl font-bold text-black mb-1">{totalFormatted}</p>
            <p className="text-xs text-gray-400">Final prices on retailer site may vary</p>
          </div>
        )}
      </div>
    </>
  )
}
