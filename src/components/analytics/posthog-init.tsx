"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/analytics/posthog";

/**
 * Mounts once in the root layout and triggers PostHog init in the browser.
 * Safe to render server-side (the underlying init is no-op there).
 */
export function PostHogInit() {
  useEffect(() => {
    initPostHog();
  }, []);
  return null;
}
