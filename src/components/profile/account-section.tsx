"use client";

import { useState, useTransition } from "react";
import { Btn, SettingsRow, Stamp } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteUserAccount, exportUserData } from "@/app/(app)/profile/actions";

interface Props {
  email: string;
}

export function AccountSection({ email }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function signOut() {
    setErr(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErr(error.message);
      return;
    }
    window.location.href = "/";
  }

  async function changePassword() {
    setErr(null);
    setInfo(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) setErr(error.message);
    else setInfo("Check your inbox for a password-reset link.");
  }

  function downloadExport() {
    setErr(null);
    startTransition(async () => {
      try {
        const blob = await exportUserData();
        const url = URL.createObjectURL(
          new Blob([blob], { type: "application/json" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `yournextbg-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Export failed.");
      }
    });
  }

  function deleteAccount() {
    setErr(null);
    startTransition(async () => {
      try {
        await deleteUserAccount();
        // deleteUserAccount() redirects on success; if we land here it's an
        // error we surfaced through throw.
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Delete failed.");
        setConfirming(false);
      }
    });
  }

  return (
    <section id="account" className="flex flex-col">
      <h2
        className="font-cs-display text-cs-ink mb-2"
        style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        Account
      </h2>

      <SettingsRow
        title="Email"
        sub="The address we use to sign you in."
        control={
          <span
            className="font-cs-mono text-cs-ink"
            style={{ fontSize: 12, letterSpacing: "0.06em" }}
          >
            {email}
          </span>
        }
      />

      <SettingsRow
        title="Change password"
        sub="We'll send a reset link to the email above."
        control={
          <Btn tone="ghost" size="sm" onClick={changePassword} disabled={pending}>
            Email me a link
          </Btn>
        }
      />

      <SettingsRow
        title="Export my data"
        sub="Download a JSON archive of your shelf, ratings, dismissals, and prefs."
        control={
          <Btn tone="ghost" size="sm" onClick={downloadExport} disabled={pending}>
            {pending ? "Preparing…" : "Download"}
          </Btn>
        }
      />

      <SettingsRow
        title="Sign out"
        sub="End this session on this device."
        control={
          <Btn tone="ghost" size="sm" onClick={signOut}>
            Sign out
          </Btn>
        }
      />

      <SettingsRow
        title="Delete account"
        sub="Permanently remove your shelf, ratings, dismissals, and account. This can't be undone."
        control={
          confirming ? (
            <div className="flex items-center gap-2">
              <Btn tone="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Btn>
              <Btn
                tone="primary"
                size="sm"
                onClick={deleteAccount}
                disabled={pending}
                style={{ background: "var(--cs-negative)" }}
              >
                {pending ? "Deleting…" : "Delete forever"}
              </Btn>
            </div>
          ) : (
            <Btn tone="ghost" size="sm" onClick={() => setConfirming(true)}>
              Delete…
            </Btn>
          )
        }
      />

      {info && (
        <Stamp color="positive" size={10}>
          {info}
        </Stamp>
      )}
      {err && (
        <Stamp color="negative" size={10}>
          {err}
        </Stamp>
      )}
    </section>
  );
}
