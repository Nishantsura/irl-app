"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"

// Initialize at module level so posthog is ready before any child useEffects fire
if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"
  if (key && key !== "your_posthog_project_api_key_here") {
    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
    })
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>
}
