"use client";

/**
 * Wires the user's theme preference to `<html data-theme="...">`.
 *
 * - For "auto", we listen to (prefers-color-scheme: dark) so the page
 *   tracks OS-level changes without a reload.
 * - For "light" / "dark", we apply that mode directly.
 *
 * The provider takes no children; the inline script in root layout has
 * already done the *initial* paint without FOUC. This component picks up
 * subsequent updates (prefs.theme changing via /profile, OS-level
 * scheme flip).
 */

import { useEffect } from "react";
import type { ThemeChoice } from "@/lib/supabase/types";

export function ThemeProvider({ theme }: { theme: ThemeChoice }) {
  useEffect(() => {
    const apply = (mode: "light" | "dark") => {
      document.documentElement.dataset.theme = mode;
    };
    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const onChange = (e: MediaQueryListEvent) =>
        apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    apply(theme);
  }, [theme]);
  return null;
}
