/**
 * OAuth + magic-link callback. Supabase redirects here with a `code`
 * query param; we trade it for a session (which writes the auth cookies
 * via the SSR client) and then send the user on to /shelf.
 *
 * `/shelf` itself doesn't exist yet — that's Task 5 — but redirecting
 * to it now means we don't have to revisit this file when it lands.
 *
 * If `code` is missing (someone hitting the URL directly, or a flow that
 * failed upstream), we still redirect to /shelf; gated server components
 * will bounce unauthenticated visitors back to /login.
 */

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/shelf", url.origin));
}
