import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RoastTrack — AI Diss Track Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>🔥</div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              background: "linear-gradient(90deg, #ff6b35, #f7418f)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Roast
          </span>
          <span style={{ fontSize: 72, fontWeight: 900, color: "white" }}>
            Track
          </span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.7)",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          AI writes a personalized diss track about your friend. In seconds.
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "linear-gradient(90deg, #ff6b35, #f7418f)",
            padding: "16px 40px",
            borderRadius: 16,
            fontSize: 24,
            fontWeight: 700,
            color: "white",
          }}
        >
          Try it free →
        </div>
      </div>
    ),
    { ...size }
  );
}
