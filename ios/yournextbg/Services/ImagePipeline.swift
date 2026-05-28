import Foundation
import Nuke

/// Configures Nuke's shared image pipeline + provides a typed helper for
/// resolving the right cover-variant URL for a given Game + target size.
public enum ImagePipelineConfig {

    /// Call once from App launch. Idempotent.
    public static func configure() {
        // 200 MB on disk, 60 MB in memory — matches the plan target.
        let dataCache = try? Nuke.DataCache(name: "com.yournextbg.imagecache")
        dataCache?.sizeLimit = 200 * 1024 * 1024
        let imageCache = Nuke.ImageCache.shared
        imageCache.costLimit = 60 * 1024 * 1024
        let pipeline = Nuke.ImagePipeline {
            $0.dataCache = dataCache
            $0.imageCache = imageCache
        }
        Nuke.ImagePipeline.shared = pipeline
    }
}

public enum CoverSize: Sendable {
    case sm   // shelf / row tiles
    case md   // detail hero
    case lg   // OG-image-style headers

    public func url(for game: Game) -> URL? {
        let raw: String?
        switch self {
        case .sm: raw = game.coverSmUrl ?? game.coverMdUrl ?? game.coverOriginUrl
        case .md: raw = game.coverMdUrl ?? game.coverLgUrl ?? game.coverOriginUrl
        case .lg: raw = game.coverLgUrl ?? game.coverMdUrl ?? game.coverOriginUrl
        }
        return raw.flatMap(URL.init(string:))
    }
}
