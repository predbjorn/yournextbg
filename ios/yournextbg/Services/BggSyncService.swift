import Foundation
import Supabase

/// Result of a `bgg-sync` edge-function invocation. Mirrors the
/// `BggSyncResponse` schema in `contract/openapi.yaml`.
public struct BggSyncResult: Codable, Equatable, Sendable {
    public let ok: Bool
    public let owned: Int
    public let wishlist: Int
    public let newUnscored: Int

    enum CodingKeys: String, CodingKey {
        case ok, owned, wishlist
        case newUnscored = "new_unscored"
    }
}

/// Hand-written client for the `bgg-sync` edge function. We skip the
/// swift-openapi-generator plugin for v2 (one-op surface) and instead
/// call Supabase's `functions.invoke` directly, which propagates the
/// user's bearer token automatically.
public protocol BggSyncing: Sendable {
    func sync() async throws -> BggSyncResult
}

public final class LiveBggSyncService: BggSyncing, @unchecked Sendable {
    private let client: SupabaseClient

    public init(client: SupabaseClient) {
        self.client = client
    }

    public func sync() async throws -> BggSyncResult {
        struct Body: Encodable {
            let triggered_by: String
        }
        return try await client.functions.invoke(
            "bgg-sync",
            options: FunctionInvokeOptions(body: Body(triggered_by: "manual"))
        )
    }
}
