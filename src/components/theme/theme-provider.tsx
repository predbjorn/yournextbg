"use client";

/**
 * Keeps `<html data-theme>` in sync with the user's preference at runtime.
 *
 * Initial paint is handled by the inline script in root layout — this
 * provider only runs after hydration. Its job is to track:
 *  - OS scheme changes when theme=auto;
 *  - cookie updates from /profile's PrefsSection (we re-read on mount,
 *    so a route navigation back to a Cardstock page picks up the new
 *    choice without a hard reload).
 */

import { useEffect } from "react";
import type { ThemeChoice } from "@/lib/supabase/types";

function readCookieTheme(): ThemeChoice {
  if (typeof document === "undefined") return "auto";
  const m = document.cookie.match(/(?:^|; )yntb-theme=([^;]+)/);
  const v = m ? decodeURIComponent(m[1]) : "auto";
  return v === "light" || v === "dark" ? v : "auto";
}

export function ThemeProvider() {
  useEffect(() => {
    const apply = (mode: "light" | "dark") => {
      document.documentElement.dataset.theme = mode;
    };
    const theme = readCookieTheme();
    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const onChange = (e: MediaQueryListEvent) =>
        apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    apply(theme);
  }, []);
  return null;
}
