// In-memory rate limiter — resets on cold start (acceptable for current scale).
// Each Vercel function instance has its own in-memory state, which means the
// effective limit is "max per instance per window", not global. This still
// stops the vast majority of casual abuse and credit-drain bots.

interface RateLimitEntry {
  count: number
  resetAt: number // epoch ms when the current window expires
}

const store = new Map<string, RateLimitEntry>()

// Prune entries whose windows have expired so the Map doesn't grow unboundedly.
function pruneExpired(): void {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

/**
 * Extract the real client IP from a request.
 * Checks x-forwarded-for first (set by Vercel/CDN), falls back to x-real-ip.
 */
export function getClientIp(request: Request): string {
  const forwarded = (request.headers as Headers).get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = (request.headers as Headers).get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}

/**
 * Returns true if the request is within the allowed rate, false if exceeded.
 *
 * @param key      Unique bucket identifier — use `"${ip}:${routeName}"` pattern
 * @param max      Maximum requests allowed in the window
 * @param windowMs Window duration in milliseconds (default: 1 hour)
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number = 60 * 60 * 1000
): boolean {
  // Prune ~1% of calls to avoid unbounded Map growth without adding overhead
  if (Math.random() < 0.01) pruneExpired()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // First request in a new window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false // limit exceeded

  entry.count++
  return true
}
