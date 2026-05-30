'use client'

import { useRef, useState, useEffect, ChangeEvent, DragEvent } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { RevealWaveImage } from '@/components/ui/reveal-wave-image'
import { CartoonButton } from '@/components/ui/cartoon-button'
import { getSaveCounts } from '@/lib/savedItems'

interface HeroHomeProps {
  onImageSelected: (file: File) => void
  isAnalyzing: boolean
}

export default function HeroHome({ onImageSelected, isAnalyzing }: HeroHomeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    try {
      const { products, looks } = getSaveCounts()
      setSavedCount(products + looks)
    } catch { /* ignore */ }
  }, [])

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function validateFile(file: File): string | null {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) return 'Please upload a JPEG, PNG, or WebP image'
    if (file.size > 5 * 1024 * 1024) return 'Image must be under 5MB'
    return null
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (validateFile(file)) return
    onImageSelected(file)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (validateFile(file)) return
    onImageSelected(file)
  }

  if (isAnalyzing) return null

  return (
    <div
      className="fixed inset-0"
      style={{ background: '#0a0a0a' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Reveal wave background */}
      <div className="absolute inset-0 z-0" style={{ opacity: 0.6 }}>
        <RevealWaveImage
          src="/lifestyle2.png"
          waveSpeed={0.04}
          waveFrequency={0.7}
          waveAmplitude={0.3}
          revealRadius={0.5}
          revealSoftness={1}
          pixelSize={2}
          mouseRadius={0.4}
          baseReveal={0.88}
        />
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="text-center"
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'white',
              fontSize: '2rem',
              letterSpacing: '-0.5px',
            }}
          >
            Drop it here
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-30">
        <div
          className="flex items-center justify-between h-14 lg:h-16 px-5 lg:px-10 xl:px-16"
          style={{ maxWidth: '1280px', margin: '0 auto' }}
        >
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              color: 'white',
              letterSpacing: '-0.3px',
            }}
          >
            IRL
          </div>

          <Link
            href="/saved"
            className="relative flex items-center gap-1.5 transition-all duration-150"
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              minHeight: '36px',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'white' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)' }}
          >
            <span className="block lg:hidden">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <span className="hidden lg:block text-sm">Saved</span>

            {savedCount > 0 && (
              <span
                className="flex items-center justify-center"
                style={{
                  width: '16px', height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  fontFamily: 'var(--font-dm-sans)',
                  fontWeight: 600,
                  fontSize: '10px',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {savedCount > 9 ? '9+' : savedCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Center content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: 'white',
            textAlign: 'center',
            marginBottom: '0.75rem',
            mixBlendMode: 'difference',
          }}
        >
          InRealLife
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '14px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            marginBottom: '1.5rem',
            maxWidth: '320px',
            lineHeight: 1.25,
          }}
        >
          Upload any outfit photo and shop every piece instantly
        </p>

        {/* Upload button */}
        <div className="pointer-events-auto">
          <CartoonButton
            label="drop your fit bish"
            icon={<Plus size={16} strokeWidth={2.5} />}
            color="bg-white"
            hoverColor="hover:bg-orange-400"
            onClick={handleUploadClick}
          />
        </div>

        {/* Helper text */}
        <p
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '11px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.25)',
            marginTop: '16px',
            letterSpacing: '0.02em',
          }}
        >
          or drag & drop · JPG, PNG, WEBP
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
    </div>
  )
}
