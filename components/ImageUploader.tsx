"use client"

import { useRef, useState, DragEvent, ChangeEvent } from "react"

interface Props {
  onImageSelected: (file: File) => void
}

export default function ImageUploader({ onImageSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  function validate(file: File): string | null {
    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return "Invalid file type. Use JPG, PNG, or WEBP."
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File too large. Maximum 5MB."
    }
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    onImageSelected(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-200
          flex flex-col items-center justify-center gap-4 text-center
          ${dragging
            ? "border-black bg-gray-50 scale-[1.01]"
            : "border-gray-300 hover:border-gray-500 hover:bg-gray-50"
          }
        `}
      >
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <div>
          <p className="text-xl font-semibold text-gray-800">Drop your outfit here</p>
          <p className="text-gray-500 mt-1">Upload from Pinterest, Instagram, or your camera roll</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-black text-white text-sm rounded-full font-medium">
            Choose Photo
          </span>
          <span className="text-gray-400 text-sm">or drag and drop</span>
        </div>

        <p className="text-xs text-gray-400">JPG, PNG, WEBP · Max 5MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      {validationError && (
        <p className="mt-2 text-sm text-red-600 text-center">{validationError}</p>
      )}
    </div>
  )
}
