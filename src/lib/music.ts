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
    positive: ["hip-hop", "rap", "bouncy beat", "heavy bass", "confident vocals"],
    negative: ["slow", "acoustic", "classical"],
  },
  pop: {
    positive: ["pop", "catchy", "upbeat", "bright synths", "sing-along"],
    negative: ["heavy metal", "dark", "slow"],
  },
  reggaeton: {
    positive: ["reggaeton", "dembow beat", "Latin rhythm", "tropical", "playful"],
    negative: ["rock", "classical", "slow ballad"],
  },
  country: {
    positive: ["country", "twangy guitar", "storytelling", "honky-tonk", "humorous"],
    negative: ["electronic", "hip-hop", "heavy"],
  },
  rock: {
    positive: ["punk rock", "electric guitar", "aggressive energy", "raw", "loud"],
    negative: ["gentle", "acoustic", "electronic"],
  },
  edm: {
    positive: ["EDM", "electronic", "synth drop", "danceable", "energetic"],
    negative: ["acoustic", "slow", "classical"],
  },
};

function parseLyricsToSections(lyrics: string): { name: string; lines: string[] }[] {
  const sections: { name: string; lines: string[] }[] = [];
  let currentSection = { name: "Verse 1", lines: [] as string[] };

  for (const line of lyrics.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for section headers like "Verse 1", "Chorus", "[Verse 1]", etc.
    const sectionMatch = trimmed.match(/^\[?\s*(Verse\s*\d*|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus)\s*\]?\s*$/i);
    if (sectionMatch) {
      if (currentSection.lines.length > 0) {
        sections.push({ ...currentSection });
      }
      currentSection = { name: sectionMatch[1], lines: [] };
    } else {
      // Remove parenthetical stage directions like (Ah!), (Haha!)
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

  // Build composition plan with sections
  const sections: MusicSection[] = parsedSections.map((s) => ({
    section_name: s.name,
    positive_local_styles: s.name.toLowerCase().includes("chorus")
      ? ["catchy", "energetic", "sing-along"]
      : ["rhythmic", "flowing"],
    negative_local_styles: [],
    duration_ms: Math.min(Math.max(s.lines.length * 4000, 8000), 30000),
    lines: s.lines.slice(0, 8), // Max 8 lines per section
  }));

  const compositionPlan: CompositionPlan = {
    positive_global_styles: [...styles.positive, "funny", "roast", "diss track"],
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
