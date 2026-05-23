/**
 * Compile-time feature flags surfaced through public env vars.
 *
 * BGG sync is gated until the Supabase edge function (`bgg-sync`) is wired
 * up against a working BGG API key. Until `NEXT_PUBLIC_BGG_SYNC_ENABLED=1`
 * is set in the deployment environment, the Profile section reads
 * "coming soon" and the Shelf header omits the Re-sync button.
 *
 * Keep the public name in sync with the var documented in docs/runbook.md
 * and .env.example.
 */
export const BGG_SYNC_ENABLED =
  process.env.NEXT_PUBLIC_BGG_SYNC_ENABLED === "1";
