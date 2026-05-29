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
    if (!validTypes.includes(file.type)) return "Invalid file type. Use JPG, PNG, or WEBP."
    if (file.size > 5 * 1024 * 1024) return "File too large. Maximum 5MB."
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setValidationError(err); return }
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
        className="cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-200"
        style={{
          width: "100%",
          height: "280px",
          borderRadius: "20px",
          border: dragging
            ? "1px dashed rgba(255,255,255,0.6)"
            : "1px dashed rgba(255,255,255,0.2)",
          background: dragging
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.03)",
          transform: dragging ? "scale(1.01)" : "scale(1)",
        }}
        onMouseEnter={(e) => {
          if (!dragging) {
            const el = e.currentTarget as HTMLDivElement
            el.style.background = "rgba(255,255,255,0.06)"
            el.style.borderColor = "rgba(255,255,255,0.35)"
          }
        }}
        onMouseLeave={(e) => {
          if (!dragging) {
            const el = e.currentTarget as HTMLDivElement
            el.style.background = "rgba(255,255,255,0.03)"
            el.style.borderColor = "rgba(255,255,255,0.2)"
          }
        }}
      >
        {/* Upload icon */}
        <div className="mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <p
          className="text-white mb-2"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 500,
            fontSize: "16px",
          }}
        >
          Drop your outfit here
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 400,
            fontSize: "13px",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          or click to browse · JPG, PNG, WEBP · Max 5MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      {validationError && (
        <p
          className="mt-3 text-center"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "13px",
            color: "rgba(239,68,68,0.9)",
          }}
        >
          {validationError}
        </p>
      )}
    </div>
  )
}
