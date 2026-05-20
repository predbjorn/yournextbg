/**
 * Apple touch icon for iOS home screen / Safari pinned tabs.
 */

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f78166",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0d1117",
          fontSize: 130,
          fontWeight: 800,
          fontFamily: "serif",
          letterSpacing: -4,
        }}
      >
        y
      </div>
    ),
    { ...size },
  );
}
