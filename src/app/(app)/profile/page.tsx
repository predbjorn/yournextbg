import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-session";
import { getMyPrefs } from "@/lib/profile/queries";
import { BggSection } from "@/components/profile/bgg-section";
import { PrefsSection } from "@/components/profile/prefs-section";
import { AccountSection } from "@/components/profile/account-section";
import { Stamp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const prefs = await getMyPrefs();
  if (!prefs) {
    // The auth.users → user_prefs trigger should have populated this on
    // signup. If we ever miss the row, fail loud rather than rendering an
    // inconsistent UI.
    throw new Error("user_prefs row missing — auth signup trigger may have failed.");
  }

  return (
    <main className="min-h-screen bg-cs-paper-deep cs-grain">
      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <header className="mb-8">
          <Stamp color="muted">profile</Stamp>
          <h1
            className="font-cs-display text-cs-ink mt-1"
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Settings
          </h1>
        </header>

        <div className="flex flex-col gap-12">
          <BggSection
            initial={{
              bgg_username: prefs.bgg_username,
              auto_sync_bgg: prefs.auto_sync_bgg,
              import_bgg_ratings: prefs.import_bgg_ratings,
              last_bgg_sync_at: prefs.last_bgg_sync_at,
            }}
          />
          <PrefsSection
            initial={{
              theme: prefs.theme,
              default_lens: prefs.default_lens,
              hide_owned: prefs.hide_owned,
              hide_dismissed: prefs.hide_dismissed,
            }}
          />
          <AccountSection email={user.email ?? ""} />
        </div>
      </div>
    </main>
  );
}
