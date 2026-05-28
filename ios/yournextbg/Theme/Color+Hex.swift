import SwiftUI

extension Color {
    /// Initializes a `Color` from a `#rrggbb` / `#aarrggbb` hex string,
    /// matching the format used in `src/app/globals.css`. Falls back to
    /// black on a bad string — we surface the warning to stderr in
    /// DEBUG but do not crash, since theme tokens are a "soft" failure.
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }

        var value: UInt64 = 0
        guard Scanner(string: s).scanHexInt64(&value) else {
            #if DEBUG
            print("[Theme] bad hex string: \(hex)")
            #endif
            self = .black
            return
        }

        let a, r, g, b: UInt64
        switch s.count {
        case 6:
            a = 255
            r = (value >> 16) & 0xFF
            g = (value >> 8) & 0xFF
            b = value & 0xFF
        case 8:
            a = (value >> 24) & 0xFF
            r = (value >> 16) & 0xFF
            g = (value >> 8) & 0xFF
            b = value & 0xFF
        default:
            #if DEBUG
            print("[Theme] bad hex length: \(hex)")
            #endif
            self = .black
            return
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
