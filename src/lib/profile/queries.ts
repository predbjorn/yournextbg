/**
 * Server-side profile loader. RLS already scopes user_prefs to the
 * caller, so we just select the single row.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DbUserPrefs } from "@/lib/supabase/types";

export async function getMyPrefs(): Promise<DbUserPrefs | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_prefs")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data as DbUserPrefs | null) ?? null;
}
