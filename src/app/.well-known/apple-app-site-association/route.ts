/**
 * Apple App Site Association (AASA) endpoint.
 *
 * Apple's universal-link verifier fetches this at
 *   https://yournextbg.com/.well-known/apple-app-site-association
 * to confirm that this domain owns the magic-link return URL we declared
 * in the iOS app's entitlements (`applinks:yournextbg.com`).
 *
 * Spec requirements Apple enforces:
 *   - Served at the exact path above, no file extension.
 *   - HTTP 200, Content-Type `application/json`.
 *   - HTTPS only (Vercel handles this).
 *   - Body is a JSON object with the shape below — no extra wrapping.
 *
 * `appID` = `<Apple Team ID>.<bundle id>` for the iOS app.
 *
 * If you ever add more universal-link paths (e.g. share links to /games/*),
 * extend the `paths` array. Apple recommends explicit `/path*` globs over
 * `*` to avoid catching unrelated routes.
 */

const AASA = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "WEPFSXK95X.com.yournextbg.app",
        paths: ["/auth/callback*"],
      },
    ],
  },
} as const;

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(AASA), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600, must-revalidate",
    },
  });
}
