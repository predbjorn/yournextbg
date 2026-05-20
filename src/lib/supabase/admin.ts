/**
 * Service-role Supabase client. Server-only — never expose to the browser.
 *
 * Used for: admin seeding, scoring pipeline writes, BGG cache hydration,
 * any task that legitimately bypasses RLS.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing env var ${name}. Set it in .env.local (never commit). ` +
        `Find your service role key at: https://supabase.com/dashboard/project/_/settings/api`,
    );
  }
  return v;
}

export function getSupabaseAdminClient() {
  return createClient<Database>(
    envOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    envOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
