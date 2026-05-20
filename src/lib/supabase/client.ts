/**
 * Supabase browser client. Use inside Client Components.
 *
 * Reads env at module load. Throws clearly if NEXT_PUBLIC_SUPABASE_* are missing.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing env var ${name}. Copy .env.example to .env.local and fill in your Supabase credentials.`,
    );
  }
  return v;
}

export function getSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    envOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    envOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
