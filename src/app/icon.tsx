/**
 * Dynamically generated favicon. Small "y" on the brand orange background,
 * rendered at 32×32 for browser tabs.
 */

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 24,
          fontWeight: 800,
          fontFamily: "serif",
          letterSpacing: -1,
        }}
      >
        y
      </div>
    ),
    { ...size },
  );
}
