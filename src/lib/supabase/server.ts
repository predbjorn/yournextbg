/**
 * Supabase server client. Use inside Server Components, Route Handlers,
 * and Server Actions.
 *
 * Reads/writes Next.js cookies for session persistence. The cookie writes
 * may no-op outside a mutation context — that's fine; the proxy will
 * still refresh sessions on the next navigation.
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
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

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    envOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    envOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies are read-only.
            // Middleware will handle session refresh.
          }
        },
      },
    },
  );
}
