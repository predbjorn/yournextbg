import Foundation
import Supabase

/// Errors thrown while resolving Supabase config from the bundle.
public enum SupabaseConfigError: Error, CustomStringConvertible {
    case missingURL
    case missingAnonKey

    public var description: String {
        switch self {
        case .missingURL:
            return "Supabase config missing: SUPABASE_URL not in Info.plist"
        case .missingAnonKey:
            return "Supabase config missing: SUPABASE_ANON_KEY is empty, unset, or still REPLACE_ME. "
                + "Set it in ios/yournextbg.xcconfig.local or via CI secrets."
        }
    }
}

/// Process-wide Supabase client. Reads `SUPABASE_URL` + `SUPABASE_ANON_KEY`
/// from the bundle Info.plist, which is populated at build time from
/// `ios/yournextbg.xcconfig` (and overridden by CI / a local
/// `.xcconfig.local`).
///
/// The service-role key is **never** in the iOS bundle — only the public
/// `anon` key. All privileged work goes through edge functions or DB
/// row-level security.
public enum SupabaseService {
    /// Lazily-initialized shared client. `nil` if the bundle wasn't
    /// configured (e.g., a contributor forgot to fill in `.xcconfig.local`).
    /// Screens that touch the network surface a Cardstock error state
    /// rather than crashing the process.
    public static let client: SupabaseClient? = {
        do {
            let config = try readConfig(from: Bundle.main)
            return SupabaseClient(supabaseURL: config.url, supabaseKey: config.anonKey)
        } catch {
            #if DEBUG
            print("[SupabaseService] init failed: \(error)")
            #endif
            return nil
        }
    }()

    /// Resolves Supabase config from a bundle. Public for unit tests:
    /// pass `Bundle(for: TestCase.self)` to verify parsing without
    /// touching the live app bundle.
    public static func readConfig(from bundle: Bundle) throws -> (url: URL, anonKey: String) {
        guard let urlString = bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              !urlString.isEmpty,
              let url = URL(string: urlString) else {
            throw SupabaseConfigError.missingURL
        }
        guard let key = bundle.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
              !key.isEmpty, key != "REPLACE_ME" else {
            throw SupabaseConfigError.missingAnonKey
        }
        return (url, key)
    }
}
