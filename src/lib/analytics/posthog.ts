"use client";

/**
 * PostHog client bootstrap + thin wrapper used throughout the app.
 *
 * Init is no-op when the public key is unset (local dev without analytics).
 * `capture()` always exists — if PostHog isn't initialized, it's a noop so
 * call sites stay clean.
 *
 * Event taxonomy (kept here as canonical source of truth):
 *   rating_submitted          { game_id, rating }
 *   lens_changed              { from_lens, to_lens }
 *   b_pinned                  { a_game_id, b_game_id, similarity }
 *   recommendation_dismissed  { game_id, rank }
 *   shelf_add_manual          { game_id }
 *   bgg_sync_completed        { owned, wishlist, new_unscored }
 */

import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
  });
  initialized = true;
}

export type EventName =
  | "rating_submitted"
  | "lens_changed"
  | "b_pinned"
  | "recommendation_dismissed"
  | "shelf_add_manual"
  | "bgg_sync_completed";

export function capture(
  event: EventName,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.capture(event, properties);
}

export { posthog };
