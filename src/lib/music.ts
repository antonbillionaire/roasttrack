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

// Negative styles shared by all genres — always block acapella
const ALWAYS_NEGATIVE = ["acapella", "a cappella", "no instruments", "spoken word", "podcast", "ambient noise"];

const GENRE_STYLES: Record<string, { positive: string[]; negative: string[] }> = {
  hiphop: {
    positive: ["hip-hop beat", "rap vocals", "boom bap drums", "heavy 808 bass", "vinyl scratches", "confident male vocals", "full instrumental backing"],
    negative: [...ALWAYS_NEGATIVE, "slow ballad", "classical orchestra"],
  },
  pop: {
    positive: ["pop music", "dance pop beat", "bright synthesizer melody", "four-on-the-floor drums", "catchy vocal hook", "radio-ready production", "full band"],
    negative: [...ALWAYS_NEGATIVE, "heavy distortion", "dark atmosphere"],
  },
  reggaeton: {
    positive: ["reggaeton dembow beat", "Latin percussion", "dancehall bass", "tropical synth melody", "Spanish guitar strum", "perreo rhythm", "full Latin production"],
    negative: [...ALWAYS_NEGATIVE, "rock guitar", "classical piano"],
  },
  country: {
    positive: ["country music", "acoustic guitar strumming", "twangy electric guitar", "fiddle melody", "steady kick-snare beat", "Nashville production", "full country band"],
    negative: [...ALWAYS_NEGATIVE, "electronic synths", "hip-hop beat"],
  },
  rock: {
    positive: ["punk rock", "distorted electric guitar", "driving drum beat", "bass guitar riff", "aggressive energy", "full rock band", "loud arena sound"],
    negative: [...ALWAYS_NEGATIVE, "gentle", "soft piano", "electronic beat"],
  },
  edm: {
    positive: ["EDM drop", "electronic synthesizer", "four-on-the-floor kick drum", "heavy bass wobble", "build-up and drop", "festival energy", "full electronic production"],
    negative: [...ALWAYS_NEGATIVE, "acoustic guitar", "slow tempo", "classical"],
  },
  rnb: {
    positive: ["R&B groove", "neo-soul beat", "smooth electric piano chords", "808 kick and snare", "silky vocal melody", "groovy bass guitar", "full R&B production"],
    negative: [...ALWAYS_NEGATIVE, "heavy metal distortion", "fast punk tempo"],
  },
  afrobeat: {
    positive: ["afrobeat rhythm", "West African percussion", "talking drum pattern", "horn section melody", "groovy bass guitar", "polyrhythmic drums", "full Afrobeat band", "danceable groove"],
    negative: [...ALWAYS_NEGATIVE, "slow ballad", "classical", "heavy metal"],
  },
  kpop: {
    positive: ["K-pop dance pop", "bright synth-pop melody", "hard-hitting electronic beat", "layered vocal harmony", "trap-influenced hi-hats", "polished idol-group production", "catchy hook", "full K-pop production"],
    negative: [...ALWAYS_NEGATIVE, "acoustic folk", "dark ambient", "slow tempo"],
  },
};

function parseLyricsToSections(lyrics: string): { name: string; lines: string[] }[] {
  const sections: { name: string; lines: string[] }[] = [];
  let currentSection = { name: "Verse", lines: [] as string[] };

  for (const line of lyrics.split("\n")) {
    // Strip markdown formatting: **bold**, ##headers, trailing colons
    const stripped = line.trim()
      .replace(/^\*{1,3}\s*/, "").replace(/\s*\*{1,3}$/, "")
      .replace(/^#{1,3}\s*/, "")
      .replace(/:\s*$/, "");
    if (!stripped) continue;

    const sectionMatch = stripped.match(/^\[?\s*(Verse\s*\d*|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus)\s*\]?\s*$/i);
    if (sectionMatch) {
      if (currentSection.lines.length > 0) {
        sections.push({ ...currentSection });
      }
      currentSection = { name: sectionMatch[1], lines: [] };
    } else {
      // Clean: remove syllable counts (10), parenthetical notes, markdown, quotes
      const cleanLine = stripped
        .replace(/\s*\(\d{1,2}\)\s*$/, "")
        .replace(/\([^)]*\)/g, "")
        .replace(/^\*{1,3}/, "").replace(/\*{1,3}$/, "")
        .replace(/^["'`]|["'`]$/g, "")
        .trim();
      if (cleanLine && cleanLine.length > 1) {
        currentSection.lines.push(cleanLine);
      }
    }
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  console.log("Parsed sections:", JSON.stringify(sections.map(s => ({ name: s.name, lineCount: s.lines.length, lines: s.lines }))));
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
      ? ["catchy hook", "energetic", "sing-along", "louder"]
      : ["rhythmic", "flowing", "verse energy"],
    negative_local_styles: [],
    duration_ms: Math.min(durationPerSection, 20000),
    lines: s.lines.slice(0, 4),
  }));

  const compositionPlan: CompositionPlan = {
    positive_global_styles: styles.positive,
    negative_global_styles: styles.negative,
    sections,
  };

  console.log("ElevenLabs composition plan:", JSON.stringify(compositionPlan, null, 2));

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
