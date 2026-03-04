import { Metadata } from "next";
import Link from "next/link";
import TrackPlayer from "./TrackPlayer";
import ShareButtons from "./ShareButtons";
import UnlockButton from "./UnlockButton";
import DownloadButton from "./DownloadButton";

interface TrackData {
  id: string;
  name: string;
  facts: string[];
  genre: string;
  roastLevel?: string;
  language?: string;
  lyrics: string;
  audioUrl: string;
  isFreePreview?: boolean;
  createdAt: string;
}

const ROAST_LEVEL_LABELS: Record<string, { label: string; emoji: string }> = {
  funny: { label: "Funny", emoji: "😂" },
  hard: { label: "Hard", emoji: "😈" },
  extreme: { label: "Extreme", emoji: "💀" },
};

async function getTrack(id: string): Promise<TrackData | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks/${id}.json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params;
  const track = await getTrack(id);

  if (!track) {
    return { title: "Track Not Found — RoastTrack" };
  }

  return {
    title: `${track.name}'s Roast — RoastTrack`,
    description: `Listen to ${track.name}'s AI-generated diss track!`,
    openGraph: {
      title: `${track.name} just got ROASTED`,
      description: `AI wrote a diss track about ${track.name}. Listen now!`,
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title: `${track.name} just got ROASTED`,
      description: `AI wrote a diss track about ${track.name}. Listen now!`,
    },
  };
}

const GENRE_LABELS: Record<string, { label: string; emoji: string }> = {
  hiphop: { label: "Hip-Hop", emoji: "🎤" },
  pop: { label: "Pop", emoji: "🎵" },
  reggaeton: { label: "Reggaeton", emoji: "🌴" },
  country: { label: "Country", emoji: "🤠" },
  rock: { label: "Rock", emoji: "🎸" },
  edm: { label: "EDM", emoji: "🎧" },
};

export default async function TrackPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const track = await getTrack(id);

  if (!track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-warm">
        <div className="text-6xl mb-6">😵</div>
        <h1 className="text-3xl font-black mb-4">Track Not Found</h1>
        <p className="text-gray-500 mb-6">
          This roast doesn&apos;t exist or has been removed.
        </p>
        <Link href="/" className="gradient-btn px-8 py-3 rounded-xl font-bold">
          Create a Roast
        </Link>
      </div>
    );
  }

  const genreInfo = GENRE_LABELS[track.genre] || { label: track.genre, emoji: "🎵" };
  const levelInfo = track.roastLevel && ROAST_LEVEL_LABELS[track.roastLevel];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 bg-warm">
      {/* Header */}
      <Link href="/" className="text-2xl font-black tracking-tight mb-8 animate-slide-up">
        <span className="gradient-text">Roast</span>
        <span>Track</span>
      </Link>

      <div className="w-full max-w-md animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {/* Track Card — dark for album cover feel */}
        <div className="track-card rounded-2xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3 fire-bounce">🔥</div>
            <h1 className="text-3xl font-black mb-3">
              {track.name}&apos;s Roast
            </h1>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-block px-4 py-1.5 bg-white/15 rounded-full text-sm text-white/80 font-medium">
                {genreInfo.emoji} {genreInfo.label}
              </span>
              {levelInfo && (
                <span className="inline-block px-4 py-1.5 bg-white/15 rounded-full text-sm text-white/80 font-medium">
                  {levelInfo.emoji} {levelInfo.label}
                </span>
              )}
            </div>
          </div>

          <TrackPlayer audioUrl={track.audioUrl} isFreePreview={track.isFreePreview ?? false} />
        </div>

        {/* Unlock / Download */}
        {track.isFreePreview ? (
          <div className="mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <UnlockButton trackId={track.id} />
          </div>
        ) : (
          <div className="mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <DownloadButton audioUrl={track.audioUrl} name={track.name} />
          </div>
        )}

        {/* Lyrics */}
        <div className="card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>Lyrics</span>
            <span className="text-base">📝</span>
          </h2>
          <div className="space-y-0.5">
            {track.lyrics.split("\n").map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={i} className="h-3" />;

              const isHeader =
                /^\[?\s*(Verse\s*\d*|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus)\s*\]?\s*$/i.test(
                  trimmed
                );

              if (isHeader) {
                return (
                  <p
                    key={i}
                    className="gradient-text font-bold mt-5 mb-1.5 text-xs uppercase tracking-widest"
                  >
                    {trimmed.replace(/[\[\]]/g, "")}
                  </p>
                );
              }

              return (
                <p key={i} className="text-gray-600 text-sm leading-relaxed">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>

        {/* Share */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <ShareButtons name={track.name} trackId={track.id} />
        </div>

        {/* Create Another */}
        <Link
          href="/"
          className="block w-full text-center py-4 gradient-btn rounded-2xl font-bold text-lg mt-4 animate-slide-up"
          style={{ animationDelay: "0.35s" }}
        >
          🔥 Roast Someone Else
        </Link>
      </div>

      <p className="text-gray-400 text-xs mt-12">
        Made with RoastTrack — AI Diss Track Generator 💀
      </p>
    </div>
  );
}
