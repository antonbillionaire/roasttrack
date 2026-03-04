import { Metadata } from "next";
import Link from "next/link";
import TrackPlayer from "./TrackPlayer";
import ShareButtons from "./ShareButtons";

interface TrackData {
  id: string;
  name: string;
  facts: string[];
  genre: string;
  roastLevel?: string;
  language?: string;
  lyrics: string;
  audioUrl: string;
  createdAt: string;
}

const ROAST_LEVEL_LABELS: Record<string, { label: string; emoji: string }> = {
  light: { label: "Light", emoji: "😏" },
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

const GENRE_LABELS: Record<string, { label: string; emoji: string; gradient: string }> = {
  hiphop: { label: "Hip-Hop", emoji: "🎤", gradient: "from-purple-500/30 to-blue-500/30" },
  pop: { label: "Pop", emoji: "🎵", gradient: "from-pink-500/30 to-rose-500/30" },
  reggaeton: { label: "Reggaeton", emoji: "🌴", gradient: "from-yellow-500/30 to-orange-500/30" },
  country: { label: "Country", emoji: "🤠", gradient: "from-amber-500/30 to-yellow-500/30" },
  rock: { label: "Rock", emoji: "🎸", gradient: "from-red-500/30 to-orange-500/30" },
  edm: { label: "EDM", emoji: "🎧", gradient: "from-cyan-500/30 to-blue-500/30" },
};

export default async function TrackPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const track = await getTrack(id);

  if (!track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-radial">
        <div className="text-6xl mb-6">😵</div>
        <h1 className="text-3xl font-black mb-4">Track Not Found</h1>
        <p className="text-zinc-400 mb-6">
          This roast doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="gradient-btn px-8 py-3 rounded-xl font-bold"
        >
          Create a Roast
        </Link>
      </div>
    );
  }

  const genreInfo = GENRE_LABELS[track.genre] || {
    label: track.genre,
    emoji: "🎵",
    gradient: "from-zinc-500/30 to-zinc-600/30",
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 bg-gradient-radial relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-16 left-8 text-3xl opacity-15 float-slow select-none pointer-events-none">🔥</div>
      <div className="absolute top-32 right-10 text-2xl opacity-10 float-medium select-none pointer-events-none">🎵</div>
      <div className="absolute bottom-40 left-12 text-2xl opacity-10 float-fast select-none pointer-events-none">💀</div>

      {/* Header */}
      <Link href="/" className="text-2xl font-black tracking-tight mb-8 animate-slide-up">
        <span className="gradient-text">Roast</span>
        <span className="text-white">Track</span>
      </Link>

      <div className="w-full max-w-md animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {/* Track Card */}
        <div className={`glass rounded-2xl p-6 mb-6 relative overflow-hidden`}>
          {/* Genre gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${genreInfo.gradient} opacity-50`} />

          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3 fire-bounce">🔥</div>
              <h1 className="text-3xl font-black mb-2">
                {track.name}&apos;s Roast
              </h1>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-sm text-zinc-300 font-medium">
                  {genreInfo.emoji} {genreInfo.label}
                </span>
                {track.roastLevel && ROAST_LEVEL_LABELS[track.roastLevel] && (
                  <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-sm text-zinc-300 font-medium">
                    {ROAST_LEVEL_LABELS[track.roastLevel].emoji} {ROAST_LEVEL_LABELS[track.roastLevel].label}
                  </span>
                )}
              </div>
            </div>

            <TrackPlayer audioUrl={track.audioUrl} />
          </div>
        </div>

        {/* Lyrics */}
        <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
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
                <p key={i} className="text-zinc-300 text-sm leading-relaxed">
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

      <p className="text-zinc-600 text-xs mt-12">
        Made with RoastTrack — AI Diss Track Generator 💀
      </p>
    </div>
  );
}
