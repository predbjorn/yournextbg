import XCTest
@testable import yournextbg

final class SupabaseServiceTests: XCTestCase {

    func testReadConfigRejectsPlaceholderAnonKey() {
        // The shipped xcconfig has anon key = REPLACE_ME until CI or a local
        // override writes the real one. Make sure we don't silently accept
        // it.
        let bundle = StubBundle(info: [
            "SUPABASE_URL": "https://gkickjaihbgapowsqwhx.supabase.co",
            "SUPABASE_ANON_KEY": "REPLACE_ME",
        ])
        XCTAssertThrowsError(try SupabaseService.readConfig(from: bundle)) { error in
            guard case SupabaseConfigError.missingAnonKey = error else {
                return XCTFail("expected missingAnonKey, got \(error)")
            }
        }
    }

    func testReadConfigRejectsEmptyURL() {
        let bundle = StubBundle(info: [
            "SUPABASE_URL": "",
            "SUPABASE_ANON_KEY": "eyJ.fake.key",
        ])
        XCTAssertThrowsError(try SupabaseService.readConfig(from: bundle)) { error in
            guard case SupabaseConfigError.missingURL = error else {
                return XCTFail("expected missingURL, got \(error)")
            }
        }
    }

    func testReadConfigAcceptsValidPair() throws {
        let bundle = StubBundle(info: [
            "SUPABASE_URL": "https://gkickjaihbgapowsqwhx.supabase.co",
            "SUPABASE_ANON_KEY": "eyJ.fake.key",
        ])
        let config = try SupabaseService.readConfig(from: bundle)
        XCTAssertEqual(config.url.host, "gkickjaihbgapowsqwhx.supabase.co")
        XCTAssertEqual(config.anonKey, "eyJ.fake.key")
    }
}

/// Bundle subclass that returns canned Info.plist values. Pure in-process,
/// no resources on disk.
private final class StubBundle: Bundle, @unchecked Sendable {
    private let info: [String: Any]

    init(info: [String: Any]) {
        self.info = info
        super.init()
    }

    override func object(forInfoDictionaryKey key: String) -> Any? {
        info[key]
    }
}
