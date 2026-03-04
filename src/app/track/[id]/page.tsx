import { Metadata } from "next";
import Link from "next/link";
import TrackPlayer from "./TrackPlayer";
import ShareButtons from "./ShareButtons";

interface TrackData {
  id: string;
  name: string;
  facts: string[];
  genre: string;
  lyrics: string;
  audioUrl: string;
  createdAt: string;
}

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
  reggaeton: { label: "Reggaeton", emoji: "🔥" },
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold mb-4">Track Not Found</h1>
        <p className="text-zinc-400 mb-6">
          This roast doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold transition-colors"
        >
          Create a Roast
        </Link>
      </div>
    );
  }

  const genreInfo = GENRE_LABELS[track.genre] || {
    label: track.genre,
    emoji: "🎵",
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Header */}
      <Link href="/" className="text-2xl font-bold tracking-tight mb-8">
        <span className="text-red-500">Roast</span>Track
      </Link>

      <div className="w-full max-w-md">
        {/* Track Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔥</div>
            <h1 className="text-2xl font-bold mb-2">
              {track.name}&apos;s Roast
            </h1>
            <span className="inline-block px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400">
              {genreInfo.emoji} {genreInfo.label}
            </span>
          </div>

          <TrackPlayer audioUrl={track.audioUrl} />
        </div>

        {/* Lyrics */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Lyrics
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
                    className="text-red-400 font-bold mt-4 mb-1 text-xs uppercase tracking-widest"
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
        <ShareButtons name={track.name} trackId={track.id} />

        {/* Create Another */}
        <Link
          href="/"
          className="block w-full text-center py-4 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-lg transition-colors mt-4"
        >
          🔥 Roast Someone Else
        </Link>
      </div>

      <p className="text-zinc-700 text-xs mt-12">
        Made with RoastTrack — AI Diss Track Generator
      </p>
    </div>
  );
}
