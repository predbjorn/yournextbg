/**
 * Session-refresh helper called from the Next.js proxy file (formerly
 * "middleware" — renamed in Next.js 16). Keeps Supabase auth cookies
 * valid on every navigation.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

export async function updateSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Gracefully skip when not configured yet — lets the app run pre-Supabase.
  if (!url || !anon) return supabaseResponse;

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Trigger session refresh by reading user — required by @supabase/ssr.
  await supabase.auth.getUser();

  return supabaseResponse;
}
