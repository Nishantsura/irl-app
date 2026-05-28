"use client"

import { useState } from "react"
import { ClothingItem, Product, ProductResults, SelectedItems, SearchingState } from "@/types"
import ImageUploader from "@/components/ImageUploader"
import OutfitBreakdown from "@/components/OutfitBreakdown"
import MyLookCart from "@/components/MyLookCart"

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])
  const [productResults, setProductResults] = useState<ProductResults>({})
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [searchingItems, setSearchingItems] = useState<SearchingState>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCount = Object.keys(selectedItems).length
  const totalPrice = Object.values(selectedItems).reduce((sum, p) => sum + p.price, 0)
  const totalFormatted = `₹${totalPrice.toLocaleString("en-IN")}`

  async function searchForItem(item: ClothingItem) {
    setSearchingItems((prev) => ({ ...prev, [item.id]: true }))
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(item.searchQuery)}`)
      const data = await res.json()
      setProductResults((prev) => ({ ...prev, [item.id]: data.products || [] }))
    } catch {
      setProductResults((prev) => ({ ...prev, [item.id]: [] }))
    } finally {
      setSearchingItems((prev) => ({ ...prev, [item.id]: false }))
    }
  }

  async function handleImageUpload(file: File) {
    setError(null)
    setClothingItems([])
    setProductResults({})
    setSelectedItems({})
    setSearchingItems({})

    const reader = new FileReader()
    reader.onload = (e) => setUploadedImage(e.target?.result as string)
    reader.readAsDataURL(file)

    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const res = await fetch("/api/analyze", { method: "POST", body: formData })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setClothingItems(data.items)

      data.items.forEach((item: ClothingItem) => {
        searchForItem(item)
      })
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleAddToLook(itemId: string, product: Product) {
    setSelectedItems((prev) => {
      if (prev[itemId]?.link === product.link) {
        const updated = { ...prev }
        delete updated[itemId]
        return updated
      }
      return { ...prev, [itemId]: product }
    })
  }

  function handleRemoveFromLook(itemId: string) {
    setSelectedItems((prev) => {
      const updated = { ...prev }
      delete updated[itemId]
      return updated
    })
  }

  function handleReset() {
    setUploadedImage(null)
    setClothingItems([])
    setProductResults({})
    setSelectedItems({})
    setIsAnalyzing(false)
    setSearchingItems({})
    setCartOpen(false)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-black">IRL</span>
          <span className="hidden sm:block text-sm text-gray-400 font-medium">See it. Wear it.</span>
          {selectedCount > 0 ? (
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
            >
              <span>My Look</span>
              <span className="w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center">
                {selectedCount}
              </span>
              <span>→</span>
            </button>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-14">
        {/* State A: No image uploaded */}
        {!uploadedImage && !isAnalyzing && (
          <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-black mb-2">See it. Wear it.</h1>
                <p className="text-gray-500">Upload any outfit and shop every piece instantly.</p>
              </div>
              <ImageUploader onImageSelected={handleImageUpload} />
            </div>
          </div>
        )}

        {/* State B: Analyzing */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-black/70 z-40 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-white text-lg font-semibold">Analyzing your outfit...</p>
              <p className="text-white/60 text-sm mt-1">Identifying every clothing piece</p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="max-w-6xl mx-auto px-4 pt-4">
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={handleReset}
                className="text-sm font-semibold text-red-700 hover:text-red-900 ml-4 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* State C: Results */}
        {uploadedImage && !isAnalyzing && clothingItems.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column */}
              <div className="lg:w-2/5 lg:sticky lg:top-20 lg:self-start">
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img
                    src={uploadedImage}
                    alt="Your outfit"
                    className="w-full object-cover max-h-[70vh]"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {clothingItems.length} items identified
                  </span>
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-500 hover:text-black transition-colors underline underline-offset-2"
                  >
                    Upload new outfit
                  </button>
                </div>
              </div>

              {/* Right column */}
              <div className="lg:w-3/5">
                <OutfitBreakdown
                  clothingItems={clothingItems}
                  productResults={productResults}
                  searchingItems={searchingItems}
                  selectedItems={selectedItems}
                  onAddToLook={handleAddToLook}
                />

                {/* Sticky bar */}
                {selectedCount > 0 && (
                  <div className="sticky bottom-4 mt-6">
                    <button
                      onClick={() => setCartOpen(true)}
                      className="w-full py-4 bg-black text-white font-semibold rounded-2xl shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      View My Look
                      <span className="bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {selectedCount}
                      </span>
                      →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <MyLookCart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        selectedItems={selectedItems}
        clothingItems={clothingItems}
        totalFormatted={totalFormatted}
        onRemove={handleRemoveFromLook}
      />
    </div>
  )
}
