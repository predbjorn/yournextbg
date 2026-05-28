import Foundation
import Sentry
import PostHog

/// Boots Sentry + PostHog from Info.plist values, and exposes a small
/// event API that no-ops when neither SDK is configured.
///
/// Event names mirror the web's taxonomy from plan 02 task 16 so that
/// post-launch funnels join across platforms.
public enum Observability {

    /// Call once from App launch. Safe to call when keys are unset (no-op).
    public static func configure() {
        let bundle = Bundle.main

        if let dsn = bundle.object(forInfoDictionaryKey: "SENTRY_DSN") as? String,
           !dsn.isEmpty {
            SentrySDK.start { options in
                options.dsn = dsn
                options.tracesSampleRate = 0.2
                options.enableUserInteractionTracing = true
                #if DEBUG
                options.environment = "debug"
                #else
                options.environment = "production"
                #endif
            }
        }

        if let key = bundle.object(forInfoDictionaryKey: "POSTHOG_API_KEY") as? String,
           !key.isEmpty {
            let host = (bundle.object(forInfoDictionaryKey: "POSTHOG_HOST") as? String)
                ?? "https://us.i.posthog.com"
            let config = PostHogConfig(apiKey: key, host: host)
            PostHogSDK.shared.setup(config)
        }
    }

    /// Identify the current user after sign-in. No-op if PostHog wasn't
    /// configured.
    public static func identify(userId: String, email: String?) {
        var props: [String: Any] = [:]
        if let email { props["email"] = email }
        PostHogSDK.shared.identify(userId, userProperties: props)

        SentrySDK.setUser(User(userId: userId))
    }

    /// Mirrors the web event taxonomy from plan 02 task 16.
    public enum Event: String {
        case signInStarted = "sign_in_started"
        case signInSucceeded = "sign_in_succeeded"
        case shelfViewed = "shelf_viewed"
        case rateSubmitted = "rate_submitted"
        case recsViewed = "recs_viewed"
        case recommendationDismissed = "recommendation_dismissed"
        case lensChanged = "lens_changed"
        case gameDetailViewed = "game_detail_viewed"
        case bggSyncTriggered = "bgg_sync_triggered"
    }

    public static func capture(_ event: Event, properties: [String: Any] = [:]) {
        PostHogSDK.shared.capture(event.rawValue, properties: properties)
    }

    /// Manual error capture — viewmodels can call this when something
    /// non-throwing-but-bad happens.
    public static func captureError(_ error: Error, context: [String: Any] = [:]) {
        SentrySDK.capture(error: error) { scope in
            for (k, v) in context { scope.setExtra(value: v, key: k) }
        }
    }
}
