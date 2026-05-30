import posthog from "posthog-js"

// Session-level event counters — used by session_summary
const sessionCounts: Record<string, number> = {}

export function track(event: string, properties: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return
  sessionCounts[event] = (sessionCounts[event] || 0) + 1
  try {
    posthog.capture(event, properties)
  } catch {
    // fail silently — never break the app
  }
}

export function getSessionCount(event: string): number {
  return sessionCounts[event] || 0
}
