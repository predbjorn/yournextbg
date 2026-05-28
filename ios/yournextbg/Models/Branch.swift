import Foundation

/// The four branches of the score skill-tree. Mirrors the `Branch` union
/// in `src/lib/scoring/axes.ts`. Raw values are the canonical identifiers
/// used in the DB and JSON-LD — do not rename without a coordinated
/// cross-platform change.
public enum Branch: String, Codable, CaseIterable, Hashable, Sendable {
    case thinking
    case interaction
    case luck
    case experience

    /// User-facing display label. Safe to localize later.
    public var label: String {
        switch self {
        case .thinking: return "Thinking"
        case .interaction: return "Interaction"
        case .luck: return "Luck"
        case .experience: return "Experience"
        }
    }

    public var tagline: String {
        switch self {
        case .thinking: return "how much brainwork?"
        case .interaction: return "how multiplayer is the multiplayer?"
        case .luck: return "where does luck live?"
        case .experience: return "how does it feel?"
        }
    }
}

/// The 12 axes that make up a `ScoreVector`. The order of cases here is
/// LOAD-BEARING: it matches the index order in `ScoreVector`. Mirrors
/// `AxisKey` + the `AXES` array in `src/lib/scoring/axes.ts`. Never
/// reorder — any change requires regenerating the parity fixture and
/// coordinating with web + Android.
public enum AxisKey: String, Codable, CaseIterable, Hashable, Sendable {
    case weight
    case depth
    case density
    case interaction
    case conflict
    case negotiation
    case input
    case output
    case catchup
    case theme
    case engine
    case narrative

    public var label: String {
        switch self {
        case .weight:      return "Weight"
        case .depth:       return "Depth"
        case .density:     return "Density"
        case .interaction: return "Interaction"
        case .conflict:    return "Conflict"
        case .negotiation: return "Negotiation"
        case .input:       return "Input"
        case .output:      return "Output"
        case .catchup:     return "Catch-up"
        case .theme:       return "Theme"
        case .engine:      return "Engine"
        case .narrative:   return "Narrative"
        }
    }

    public var branch: Branch {
        switch self {
        case .weight, .depth, .density:           return .thinking
        case .interaction, .conflict, .negotiation: return .interaction
        case .input, .output, .catchup:           return .luck
        case .theme, .engine, .narrative:         return .experience
        }
    }

    /// Index into a `ScoreVector` for this axis. Equivalent to the TS
    /// `axisIndex(key)` helper — kept as a computed property for grep.
    public var index: Int {
        // Safe to force-unwrap: `allCases` is the source of truth and
        // includes every case.
        // swiftlint:disable:next force_unwrapping
        AxisKey.allCases.firstIndex(of: self)!
    }
}

/// The 12 axis count. Use this instead of literals so the dependency on
/// the load-bearing length is grep-able.
public let AXIS_COUNT: Int = AxisKey.allCases.count
