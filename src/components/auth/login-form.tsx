"use client";

/**
 * Login form. Client component — talks to Supabase from the browser so the
 * resulting session lands in cookies on this origin without an extra round
 * trip through the server.
 *
 * Sign-in modes:
 *  - Password (default form submit).
 *  - Magic link via email (signInWithOtp).
 *  - Google OAuth (signInWithOAuth) — Supabase redirects to /auth/callback,
 *    where the route handler exchanges the code for a session.
 *  - Apple OAuth — disabled in v1 (we'll re-enable once the iOS bundle id
 *    is wired up; see plan 02 Task 3).
 *
 * Success behaviour:
 *  - Password login: hard navigate to /shelf so the new cookie is picked
 *    up by every server route on the next request (no soft-routing).
 *  - Magic link: surface an info message; the user clicks the link in
 *    their inbox, which round-trips through /auth/callback.
 *  - OAuth: Supabase handles the redirect; we never see it.
 */

import { useState, type FormEvent } from "react";
import { Btn, Stamp } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type FeedbackKind = "error" | "info";
interface Feedback {
  kind: FeedbackKind;
  message: string;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handlePasswordSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setFeedback({ kind: "error", message: error.message });
        return;
      }
      // Hard navigation so the new auth cookie is picked up by every
      // server component on the destination route.
      window.location.href = "/shelf";
    } finally {
      setPending(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setFeedback({
        kind: "error",
        message: "Enter your email above first.",
      });
      return;
    }
    setFeedback(null);
    setPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setFeedback({ kind: "error", message: error.message });
        return;
      }
      setFeedback({
        kind: "info",
        message: "Check your inbox — we just sent you a sign-in link.",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    setFeedback(null);
    setPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setFeedback({ kind: "error", message: error.message });
        setPending(false);
      }
      // On success the browser is navigated to Google's consent screen;
      // we never see the unmount, so leave `pending` truthy.
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : "Sign-in failed.",
      });
      setPending(false);
    }
  }

  const feedbackId = "login-feedback";

  return (
    <form
      onSubmit={handlePasswordSignIn}
      className="flex flex-col"
      noValidate
    >
      <Stamp color="muted">sign in</Stamp>
      <h2
        className="font-cs-display"
        style={{
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "4px 0 0",
          lineHeight: 1.05,
        }}
      >
        Welcome back.
      </h2>
      <p
        className="font-cs-display italic text-cs-ink"
        style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}
      >
        New here?{" "}
        <span
          style={{ borderBottom: "1px dotted rgba(28,26,20,0.33)" }}
        >
          Make an account
        </span>
        .
      </p>

      <div className="mt-7 flex flex-col gap-[14px]">
        <label className="block">
          <Stamp color="muted" size={9}>
            email
          </Stamp>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={pending}
            aria-describedby={feedback ? feedbackId : undefined}
            className="font-cs-display block w-full bg-cs-paper text-cs-ink rounded-lg mt-[6px] outline-none focus:ring-2 focus:ring-cs-ink/30"
            style={{
              padding: "12px 14px",
              border: "1px solid rgba(28,26,20,0.2)",
              fontSize: 15,
            }}
          />
        </label>

        <label className="block">
          <span className="flex justify-between items-baseline">
            <Stamp color="muted" size={9}>
              password
            </Stamp>
            <span
              className="font-cs-mono uppercase text-cs-muted"
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                borderBottom: "1px dotted rgba(28,26,20,0.2)",
              }}
            >
              forgot?
            </span>
          </span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            disabled={pending}
            aria-describedby={feedback ? feedbackId : undefined}
            className="font-cs-mono block w-full bg-cs-paper text-cs-ink rounded-lg mt-[6px] outline-none focus:ring-2 focus:ring-cs-ink/30"
            style={{
              padding: "12px 14px",
              border: "1px solid rgba(28,26,20,0.2)",
              fontSize: 15,
              letterSpacing: "0.2em",
            }}
          />
        </label>

        {feedback && (
          <p
            id={feedbackId}
            role={feedback.kind === "error" ? "alert" : "status"}
            className="font-cs-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              color:
                feedback.kind === "error"
                  ? "var(--cs-negative)"
                  : "var(--cs-positive)",
              marginTop: 2,
            }}
          >
            {feedback.message}
          </p>
        )}

        <Btn
          type="submit"
          tone="primary"
          size="lg"
          disabled={pending}
          style={{ marginTop: 6, width: "100%" }}
        >
          {pending ? "Signing in…" : "Sign in →"}
        </Btn>

        <div
          className="flex items-center"
          style={{ gap: 12, margin: "8px 0" }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(28,26,20,0.13)",
            }}
          />
          <Stamp color="muted" size={9}>
            or
          </Stamp>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(28,26,20,0.13)",
            }}
          />
        </div>

        <Btn
          tone="ghost"
          size="md"
          onClick={handleMagicLink}
          disabled={pending}
          style={{ width: "100%" }}
        >
          ✉ Email me a magic link
        </Btn>
        <Btn
          tone="ghost"
          size="md"
          onClick={handleGoogle}
          disabled={pending}
          style={{ width: "100%" }}
        >
          Continue with Google
        </Btn>
        <Btn
          tone="ghost"
          size="md"
          disabled
          title="Available with iOS app"
          aria-label="Continue with Apple (available with iOS app)"
          style={{ width: "100%" }}
        >
          Continue with Apple
        </Btn>
      </div>

      <p
        className="font-cs-display italic"
        style={{
          marginTop: 20,
          paddingTop: 20,
          fontSize: 12,
          opacity: 0.55,
          lineHeight: 1.5,
        }}
      >
        By continuing you agree to the terms of service and privacy
        policy. We don&apos;t sell your data; we just want to help you
        pick a game.
      </p>
    </form>
  );
}
