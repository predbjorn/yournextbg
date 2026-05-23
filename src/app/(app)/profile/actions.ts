"use server";

/**
 * Profile-page server actions: data export + account deletion.
 *
 * Both require the SUPABASE_SERVICE_ROLE_KEY since:
 * - export reads bgg_sync_log (read-self by RLS already, but doing it
 *   under one client is simpler);
 * - delete cascades auth.users which only admin can do.
 */

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function exportUserData(): Promise<string> {
  const user = await getUser();
  if (!user) throw new Error("Not signed in.");

  const admin = getSupabaseAdminClient();

  const [prefs, collections, items, dismissals, syncLog] = await Promise.all([
    admin.from("user_prefs").select("*").eq("user_id", user.id).maybeSingle(),
    admin.from("collections").select("*").eq("user_id", user.id),
    admin
      .from("collection_items")
      .select("*, collections!inner(user_id)")
      .eq("collections.user_id", user.id),
    admin.from("dismissals").select("*").eq("user_id", user.id),
    admin
      .from("bgg_sync_log")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(50),
  ]);

  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      user_prefs: prefs.data,
      collections: collections.data ?? [],
      collection_items: items.data ?? [],
      dismissals: dismissals.data ?? [],
      bgg_sync_log: syncLog.data ?? [],
    },
    null,
    2,
  );
}

export async function deleteUserAccount(): Promise<void> {
  const user = await getUser();
  if (!user) throw new Error("Not signed in.");

  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw error;

  // Best-effort: sign the current session out so the browser doesn't keep
  // an invalid cookie. Failure here is non-fatal — the account is gone.
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  redirect("/");
}
