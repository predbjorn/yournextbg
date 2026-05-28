/**
 * Supabase browser client. Use inside Client Components.
 *
 * NEXT_PUBLIC_* env vars MUST be referenced by literal name. Bundlers
 * (Turbopack, webpack) statically replace `process.env.FOO` at compile
 * time, but `process.env[name]` with a variable is a runtime lookup that
 * resolves to undefined in the browser, even when the value is set in
 * `.env.local`.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseBrowserClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase credentials, then restart the dev server.",
    );
  }
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
