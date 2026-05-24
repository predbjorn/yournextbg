import { ThemeProvider } from "@/components/theme/theme-provider";

/**
 * Wrapper for the authenticated app surface (shelf, rate, lens, recs,
 * profile). The root layout handles initial paint via an inline script;
 * here we mount the ThemeProvider so the OS scheme listener runs while
 * the user is signed in. SEO surfaces (homepage, /games/[slug]) skip
 * this layout entirely and stay statically renderable.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ThemeProvider />
      {children}
    </>
  );
}
