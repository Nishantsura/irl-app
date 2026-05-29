export interface ColorPalette {
  vibrant: string
  darkVibrant: string
  vibrantRgb: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h, s, l }
}

function componentToHex(c: number): string {
  return Math.round(c).toString(16).padStart(2, "0")
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`
}

export async function extractColorFromImage(imageDataUrl: string): Promise<ColorPalette> {
  return new Promise((resolve) => {
    const fallback: ColorPalette = {
      vibrant: "#2a2a2a",
      darkVibrant: "#0a0a0a",
      vibrantRgb: "42, 42, 42",
    }

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          const size = 80
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext("2d")
          if (!ctx) { resolve(fallback); return }

          ctx.drawImage(img, 0, 0, size, size)
          const { data } = ctx.getImageData(0, 0, size, size)

          let bestVibrant = { r: 42, g: 42, b: 42, saturation: 0 }
          let bestDark = { r: 10, g: 10, b: 10, brightness: 1 }

          for (let i = 0; i < data.length; i += 16) {
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
            if (a < 128) continue

            const { s, l } = rgbToHsl(r, g, b)

            // Vibrant: high saturation, mid lightness
            if (s > bestVibrant.saturation && s > 0.35 && l > 0.2 && l < 0.8) {
              bestVibrant = { r, g, b, saturation: s }
            }

            // Dark vibrant: high saturation, low lightness
            if (s > 0.3 && l < bestDark.brightness && l < 0.35 && l > 0.05) {
              bestDark = { r, g, b, brightness: l }
            }
          }

          const vibrantHex = rgbToHex(bestVibrant.r, bestVibrant.g, bestVibrant.b)
          const darkHex = rgbToHex(bestDark.r, bestDark.g, bestDark.b)

          resolve({
            vibrant: vibrantHex,
            darkVibrant: darkHex,
            vibrantRgb: `${bestVibrant.r}, ${bestVibrant.g}, ${bestVibrant.b}`,
          })
        } catch {
          resolve(fallback)
        }
      }
      img.onerror = () => resolve(fallback)
      img.src = imageDataUrl
    } catch {
      resolve(fallback)
    }
  })
}

export function applyColorToDom(palette: ColorPalette) {
  const root = document.documentElement
  root.style.setProperty("--color-vibrant", palette.vibrant)
  root.style.setProperty("--color-dark-vibrant", palette.darkVibrant)
  root.style.setProperty("--color-vibrant-rgb", palette.vibrantRgb)
}

export function resetColorOnDom() {
  const root = document.documentElement
  root.style.setProperty("--color-vibrant", "#1a1a1a")
  root.style.setProperty("--color-dark-vibrant", "#0a0a0a")
  root.style.setProperty("--color-vibrant-rgb", "26, 26, 26")
}
