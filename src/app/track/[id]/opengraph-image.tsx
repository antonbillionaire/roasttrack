import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RoastTrack — AI Diss Track";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GENRE_LABELS: Record<string, { label: string; emoji: string }> = {
  hiphop: { label: "Hip-Hop", emoji: "🎤" },
  trap: { label: "Trap", emoji: "🔊" },
  pop: { label: "Pop", emoji: "🎵" },
  kpop: { label: "K-Pop", emoji: "💜" },
  reggaeton: { label: "Reggaeton", emoji: "🌴" },
  rnb: { label: "R&B", emoji: "🎹" },
  country: { label: "Country", emoji: "🤠" },
  rock: { label: "Rock", emoji: "🎸" },
  metal: { label: "Metal", emoji: "🤘" },
  edm: { label: "EDM", emoji: "🎧" },
  afrobeat: { label: "Afrobeat", emoji: "🥁" },
  jazz: { label: "Jazz", emoji: "🎷" },
};

const LEVEL_LABELS: Record<string, { label: string; emoji: string }> = {
  funny: { label: "Funny", emoji: "😂" },
  hard: { label: "Hard", emoji: "😈" },
  extreme: { label: "Extreme", emoji: "💀" },
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch track metadata
  let name = "Someone";
  let genre = "hiphop";
  let roastLevel = "funny";

  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks/${id}.json`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      name = data.name || "Someone";
      genre = data.genre || "hiphop";
      roastLevel = data.roastLevel || "funny";
    }
  } catch {
    // Use defaults
  }

  const genreInfo = GENRE_LABELS[genre] || { label: genre, emoji: "🎵" };
  const levelInfo = LEVEL_LABELS[roastLevel] || { label: roastLevel, emoji: "😂" };

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
        {/* Fire emoji */}
        <div style={{ fontSize: 72, marginBottom: 8 }}>🔥</div>

        {/* Name */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "white",
            marginBottom: 8,
            maxWidth: 900,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}&apos;s Roast
        </div>

        {/* Genre + Level badges */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.15)",
              padding: "10px 24px",
              borderRadius: 100,
              fontSize: 22,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {genreInfo.emoji} {genreInfo.label}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.15)",
              padding: "10px 24px",
              borderRadius: 100,
              fontSize: 22,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {levelInfo.emoji} {levelInfo.label}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(90deg, #ff6b35, #f7418f)",
            padding: "14px 36px",
            borderRadius: 16,
            fontSize: 22,
            fontWeight: 700,
            color: "white",
          }}
        >
          Listen now on RoastTrack
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            display: "flex",
            alignItems: "baseline",
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#ff6b35",
            }}
          >
            Roast
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Track
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
