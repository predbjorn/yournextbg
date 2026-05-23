"use client";

import { useState } from "react";
import { SettingsRow, Stamp, Toggle } from "@/components/ui";
import { LENSES, type LensKey } from "@/lib/scoring";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ThemeChoice } from "@/lib/supabase/types";

export interface PrefsSectionInitial {
  theme: ThemeChoice;
  default_lens: LensKey;
  hide_owned: boolean;
  hide_dismissed: boolean;
}

const THEMES: ReadonlyArray<{ value: ThemeChoice; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function PrefsSection({ initial }: { initial: PrefsSectionInitial }) {
  const [theme, setTheme] = useState<ThemeChoice>(initial.theme);
  const [lens, setLens] = useState<LensKey>(initial.default_lens);
  const [hideOwned, setHideOwned] = useState(initial.hide_owned);
  const [hideDismissed, setHideDismissed] = useState(initial.hide_dismissed);
  const [err, setErr] = useState<string | null>(null);

  async function persist<K extends keyof PrefsSectionInitial>(
    field: K,
    value: PrefsSectionInitial[K],
  ) {
    setErr(null);
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErr("Signed out — refresh and sign in again.");
      return;
    }
    const patch = { [field]: value } as Partial<PrefsSectionInitial>;
    const { error } = await supabase
      .from("user_prefs")
      .update(patch)
      .eq("user_id", user.id);
    if (error) setErr(error.message);
    if (field === "theme") {
      const next = value as ThemeChoice;
      if (next === "auto") {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
      } else {
        document.documentElement.dataset.theme = next;
      }
    }
  }

  return (
    <section id="engine" className="flex flex-col">
      <h2
        className="font-cs-display text-cs-ink mb-2"
        style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        Recommendation engine
      </h2>

      <SettingsRow
        title="Theme"
        sub="Choose your default. Auto follows your OS preference."
        control={
          <div className="flex gap-1.5">
            {THEMES.map((t) => {
              const active = t.value === theme;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setTheme(t.value);
                    persist("theme", t.value);
                  }}
                  className={`font-cs-mono uppercase rounded-md px-3 py-1.5 ${
                    active
                      ? "bg-cs-ink text-cs-paper"
                      : "bg-cs-paper-warm text-cs-ink"
                  }`}
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    border: active
                      ? "none"
                      : "1px solid rgba(28,26,20,0.12)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        }
      />

      <SettingsRow
        title="Default lens"
        sub="Which comparison philosophy /lens opens with."
        control={
          <select
            value={lens}
            onChange={(e) => {
              const v = e.target.value as LensKey;
              setLens(v);
              persist("default_lens", v);
            }}
            className="font-cs-mono uppercase bg-cs-paper-warm text-cs-ink rounded-md px-2 py-1.5"
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              border: "1px solid rgba(28,26,20,0.12)",
            }}
          >
            {Object.values(LENSES).map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
        }
      />

      <SettingsRow
        title="Hide games I own"
        sub="Keep games already on your shelf out of /recommendations."
        control={
          <Toggle
            on={hideOwned}
            onChange={(v) => {
              setHideOwned(v);
              persist("hide_owned", v);
            }}
            label="Hide games I own"
          />
        }
      />

      <SettingsRow
        title="Hide dismissed"
        sub="Keep cards you've dismissed off the recommendations grid."
        control={
          <Toggle
            on={hideDismissed}
            onChange={(v) => {
              setHideDismissed(v);
              persist("hide_dismissed", v);
            }}
            label="Hide dismissed"
          />
        }
      />

      {err && (
        <Stamp color="negative" size={10}>
          {err}
        </Stamp>
      )}
    </section>
  );
}
