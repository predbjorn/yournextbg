/**
 * Server-side auth helpers. Use from Server Components, Route Handlers,
 * and Server Actions to read the current Supabase session or user.
 *
 * Both helpers return null when unauthenticated; neither throws. Cookie
 * refresh is handled upstream in `src/proxy.ts` via `updateSupabaseSession`.
 *
 * Note: `getUser()` is the authoritative check (it re-validates against
 * Supabase Auth). Prefer `getUser()` for gating; use `getSession()` only
 * when you need session metadata (e.g. access token) and have already
 * confirmed the user via `getUser()`.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getSession() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
