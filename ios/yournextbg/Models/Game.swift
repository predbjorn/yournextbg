import Foundation

/// A 12-axis score vector for a game. Mirrors the TS `ScoreVector` tuple
/// in `src/lib/scoring/axes.ts`. The order of values is LOAD-BEARING and
/// matches `AxisKey.allCases`:
///
///     [weight, depth, density, interaction, conflict, negotiation,
///      input, output, catchup, theme, engine, narrative]
///
/// Use the static factories or subscript by `AxisKey` to avoid hard-coded
/// indices in call sites.
public struct ScoreVector: Codable, Hashable, Sendable {
    public let values: [Double]

    public init(_ values: [Double]) {
        precondition(values.count == AXIS_COUNT,
                     "ScoreVector must have exactly \(AXIS_COUNT) values, got \(values.count)")
        self.values = values
    }

    public subscript(axis: AxisKey) -> Double {
        values[axis.index]
    }

    public subscript(index: Int) -> Double {
        values[index]
    }

    // Codable: round-trip as a plain JSON array of numbers, matching the
    // wire format in `contract/openapi.yaml` and the Supabase column.
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let arr = try container.decode([Double].self)
        guard arr.count == AXIS_COUNT else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "ScoreVector expects \(AXIS_COUNT) values, got \(arr.count)"
            )
        }
        self.values = arr
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(values)
    }
}

/// Player-count vector. Mirrors `PlayerCount` in `src/data/types.ts`.
public struct PlayerCount: Codable, Hashable, Sendable {
    public let best: [String]
    public let good: [String]
    public let bad: [String]

    public init(best: [String], good: [String], bad: [String]) {
        self.best = best
        self.good = good
        self.bad = bad
    }
}

/// A game catalog row. Mirrors the `games` Supabase table + `Game`
/// interface in `src/data/types.ts`. Field names use the Supabase
/// snake_case wire schema via CodingKeys.
public struct Game: Codable, Hashable, Identifiable, Sendable {
    public let id: String
    public let slug: String
    public let name: String
    public let bggId: Int?
    public let scores: ScoreVector
    public let solo: Double
    public let fiddly: Double
    public let playerCount: PlayerCount?
    public let signature: String?
    public let designer: String?
    public let publisher: String?
    public let year: Int?
    public let description: String?
    /// `"scored"` (full editorial scores), `"unscored"` (BGG-imported,
    /// no scores yet), etc. Optional because some legacy reads omit it.
    public let scoreStatus: String?
    public let coverOriginUrl: String?
    public let coverSmUrl: String?
    public let coverMdUrl: String?
    public let coverLgUrl: String?

    enum CodingKeys: String, CodingKey {
        case id
        case slug
        case name
        case bggId = "bgg_id"
        case scores
        case solo
        case fiddly
        case playerCount = "player_count"
        case signature
        case designer
        case publisher
        case year
        case description
        case scoreStatus = "score_status"
        case coverOriginUrl = "cover_origin_url"
        case coverSmUrl = "cover_sm_url"
        case coverMdUrl = "cover_md_url"
        case coverLgUrl = "cover_lg_url"
    }

    public init(
        id: String,
        slug: String,
        name: String,
        bggId: Int? = nil,
        scores: ScoreVector,
        solo: Double,
        fiddly: Double,
        playerCount: PlayerCount? = nil,
        signature: String? = nil,
        designer: String? = nil,
        publisher: String? = nil,
        year: Int? = nil,
        description: String? = nil,
        scoreStatus: String? = nil,
        coverOriginUrl: String? = nil,
        coverSmUrl: String? = nil,
        coverMdUrl: String? = nil,
        coverLgUrl: String? = nil
    ) {
        self.id = id
        self.slug = slug
        self.name = name
        self.bggId = bggId
        self.scores = scores
        self.solo = solo
        self.fiddly = fiddly
        self.playerCount = playerCount
        self.signature = signature
        self.designer = designer
        self.publisher = publisher
        self.year = year
        self.description = description
        self.scoreStatus = scoreStatus
        self.coverOriginUrl = coverOriginUrl
        self.coverSmUrl = coverSmUrl
        self.coverMdUrl = coverMdUrl
        self.coverLgUrl = coverLgUrl
    }
}
