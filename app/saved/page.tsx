"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SavedProduct, SavedLook } from "@/types"
import { getSavedProducts, getSavedLooks, unsaveProduct, deleteLook } from "@/lib/savedItems"
import SavedProductCard from "@/components/SavedProductCard"
import SavedLookCard from "@/components/SavedLookCard"

export default function SavedPage() {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([])
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([])
  const [activeTab, setActiveTab] = useState<"products" | "looks">("products")
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // localStorage is client-side only — read after mount
    setSavedProducts(getSavedProducts())
    setSavedLooks(getSavedLooks())
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function handleUnsaveProduct(productLink: string) {
    unsaveProduct(productLink)
    setSavedProducts((prev) => prev.filter((s) => s.product.link !== productLink))
  }

  function handleDeleteLook(lookId: string) {
    deleteLook(lookId)
    setSavedLooks((prev) => prev.filter((l) => l.id !== lookId))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(10,10,10,0.85)" : "rgba(10,10,10,0.6)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        }}
      >
        <div
          className="flex items-center justify-between px-4 md:px-8 lg:px-12"
          style={{ height: "56px", maxWidth: "1280px", margin: "0 auto" }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "22px",
              color: "white",
              letterSpacing: "-0.5px",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            IRL
          </Link>

          <span style={{
            fontFamily: "var(--font-dm-sans)", fontWeight: 400, fontSize: "13px",
            color: "rgba(255,255,255,0.4)",
          }}>
            Saved
          </span>
        </div>
      </nav>

      {/* Page content */}
      <div
        className="px-4 md:px-8"
        style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: "80px", paddingBottom: "60px" }}
      >
        {/* Header row */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 transition-colors duration-150"
            style={{
              fontFamily: "var(--font-dm-sans)", fontWeight: 400, fontSize: "14px",
              color: "rgba(255,255,255,0.4)", textDecoration: "none",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.85)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)" }}
          >
            ← Back
          </Link>

          <h1
            className="text-[36px] md:text-[48px]"
            style={{
              fontFamily: "var(--font-serif)",
              color: "white",
              letterSpacing: "-1px",
              lineHeight: 1.1,
              marginTop: "8px",
            }}
          >
            Saved
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-8 mb-8">
          <button
            onClick={() => setActiveTab("products")}
            style={{
              padding: "8px 20px",
              borderRadius: "999px",
              border: "none",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "14px",
              cursor: "pointer", transition: "all 0.15s ease",
              background: activeTab === "products" ? "white" : "transparent",
              color: activeTab === "products" ? "#0a0a0a" : "rgba(255,255,255,0.4)",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "products") (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "products") (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"
            }}
          >
            Products ({savedProducts.length})
          </button>

          <button
            onClick={() => setActiveTab("looks")}
            style={{
              padding: "8px 20px",
              borderRadius: "999px",
              border: "none",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "14px",
              cursor: "pointer", transition: "all 0.15s ease",
              background: activeTab === "looks" ? "white" : "transparent",
              color: activeTab === "looks" ? "#0a0a0a" : "rgba(255,255,255,0.4)",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "looks") (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "looks") (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"
            }}
          >
            Looks ({savedLooks.length})
          </button>
        </div>

        {/* ── Products tab ── */}
        {activeTab === "products" && (
          <>
            {savedProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 text-center" style={{ marginTop: "80px" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "rgba(255,255,255,0.4)" }}>
                  No saved products yet
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 400, fontSize: "14px", color: "rgba(255,255,255,0.25)" }}>
                  Tap the bookmark icon on any product to save it
                </p>
                <Link
                  href="/"
                  style={{
                    marginTop: "8px",
                    fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "14px",
                    color: "rgba(255,255,255,0.5)", textDecoration: "underline",
                    textUnderlineOffset: "4px",
                  }}
                >
                  Upload an outfit
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {savedProducts.map((sp) => (
                  <SavedProductCard
                    key={sp.id}
                    savedProduct={sp}
                    onUnsave={handleUnsaveProduct}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Looks tab ── */}
        {activeTab === "looks" && (
          <>
            {savedLooks.length === 0 ? (
              <div className="flex flex-col items-center gap-4 text-center" style={{ marginTop: "80px" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "rgba(255,255,255,0.4)" }}>
                  No saved looks yet
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 400, fontSize: "14px", color: "rgba(255,255,255,0.25)" }}>
                  Build a look and save it from your cart
                </p>
                <Link
                  href="/"
                  style={{
                    marginTop: "8px",
                    fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "14px",
                    color: "rgba(255,255,255,0.5)", textDecoration: "underline",
                    textUnderlineOffset: "4px",
                  }}
                >
                  Upload an outfit
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {savedLooks.map((sl) => (
                  <SavedLookCard
                    key={sl.id}
                    savedLook={sl}
                    onDelete={handleDeleteLook}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
