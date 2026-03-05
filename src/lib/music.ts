const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";

interface MusicSection {
  section_name: string;
  positive_local_styles: string[];
  negative_local_styles: string[];
  duration_ms: number;
  lines: string[];
}

interface CompositionPlan {
  positive_global_styles: string[];
  negative_global_styles: string[];
  sections: MusicSection[];
}

const GENRE_STYLES: Record<string, { positive: string[]; negative: string[] }> = {
  hiphop: {
    positive: ["hip-hop", "rap", "bouncy beat", "heavy bass", "drums", "confident vocals", "full instrumental backing"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "slow", "acoustic", "classical"],
  },
  pop: {
    positive: ["pop", "catchy", "upbeat", "bright synths", "drums", "full band", "sing-along"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "heavy metal", "dark"],
  },
  reggaeton: {
    positive: ["reggaeton", "dembow beat", "Latin rhythm", "percussion", "bass", "tropical", "full production"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "rock", "classical"],
  },
  country: {
    positive: ["country", "twangy guitar", "banjo", "drums", "full band", "honky-tonk", "upbeat"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "electronic"],
  },
  rock: {
    positive: ["punk rock", "electric guitar", "drums", "bass guitar", "aggressive energy", "full band", "loud"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "gentle", "electronic"],
  },
  edm: {
    positive: ["EDM", "electronic", "synth drop", "heavy bass", "drums", "danceable", "full production"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "acoustic", "slow"],
  },
  rnb: {
    positive: ["R&B", "soul", "smooth vocals", "groovy bass", "drums", "keys", "full production"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "heavy metal", "fast"],
  },
  trap: {
    positive: ["trap", "808 bass", "hi-hat rolls", "dark", "hard-hitting drums", "full production", "aggressive"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "acoustic", "gentle"],
  },
  jazz: {
    positive: ["jazz", "swing", "saxophone", "walking bass", "drums", "piano", "full band", "smooth"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "electronic", "heavy"],
  },
  afrobeat: {
    positive: ["afrobeat", "African percussion", "groovy bass", "drums", "danceable", "full band", "joyful"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "slow", "classical"],
  },
  kpop: {
    positive: ["K-pop", "catchy", "polished production", "synths", "drums", "full band", "bright", "energetic"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "slow", "dark"],
  },
  metal: {
    positive: ["heavy metal", "distorted guitar", "double bass drums", "aggressive vocals", "full band", "loud"],
    negative: ["acapella", "a cappella", "no instruments", "spoken word", "gentle", "acoustic", "electronic"],
  },
};

function parseLyricsToSections(lyrics: string): { name: string; lines: string[] }[] {
  const sections: { name: string; lines: string[] }[] = [];
  let currentSection = { name: "Verse", lines: [] as string[] };

  for (const line of lyrics.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionMatch = trimmed.match(/^\[?\s*(Verse\s*\d*|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus)\s*\]?\s*$/i);
    if (sectionMatch) {
      if (currentSection.lines.length > 0) {
        sections.push({ ...currentSection });
      }
      currentSection = { name: sectionMatch[1], lines: [] };
    } else {
      const cleanLine = trimmed.replace(/\([^)]*\)/g, "").trim();
      if (cleanLine) {
        currentSection.lines.push(cleanLine);
      }
    }
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

export async function generateMusic(lyrics: string, genre: string): Promise<Buffer> {
  const styles = GENRE_STYLES[genre] || GENRE_STYLES.hiphop;
  const parsedSections = parseLyricsToSections(lyrics);

  // Target: ~60 sec total. Split evenly between sections.
  const totalDurationMs = 60000;
  const durationPerSection = Math.floor(totalDurationMs / Math.max(parsedSections.length, 1));

  const sections: MusicSection[] = parsedSections.map((s) => ({
    section_name: s.name,
    positive_local_styles: s.name.toLowerCase().includes("chorus")
      ? ["catchy", "energetic", "sing-along"]
      : ["rhythmic", "flowing"],
    negative_local_styles: [],
    duration_ms: Math.min(durationPerSection, 20000),
    lines: s.lines.slice(0, 4), // Max 4 lines per section for 30-sec format
  }));

  const compositionPlan: CompositionPlan = {
    positive_global_styles: styles.positive,
    negative_global_styles: styles.negative,
    sections,
  };

  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/v1/music?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        composition_plan: compositionPlan,
        model_id: "music_v1",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("ElevenLabs error:", response.status, errorText);
    throw new Error(`Music generation failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
