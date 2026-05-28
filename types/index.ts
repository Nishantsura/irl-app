export interface ClothingItem {
  id: string
  category: string
  description: string
  searchQuery: string
}

export interface Product {
  title: string
  price: number
  priceFormatted: string
  brand: string
  rating: number
  reviewCount: number
  imageUrl: string
  link: string
  source: string
}

export interface SelectedItems {
  [clothingItemId: string]: Product
}

export interface ProductResults {
  [clothingItemId: string]: Product[]
}

export interface SearchingState {
  [clothingItemId: string]: boolean
}
