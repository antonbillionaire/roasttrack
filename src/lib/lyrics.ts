import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface LyricsRequest {
  name: string;
  facts: string[];
  genre: string;
  roastLevel: string;
  language: string;
}

// Genre-specific style + syllable guidance based on typical BPM
const GENRE_CONFIG: Record<string, { style: string; syllables: string; bpm: string }> = {
  hiphop: {
    style: "hip-hop/rap with hard-hitting bars, clever wordplay, and a bouncy beat feel",
    syllables: "8-12 syllables per line (rap flow, slightly fast)",
    bpm: "90-100 BPM",
  },
  pop: {
    style: "catchy pop with a memorable hook, upbeat rhythm, and sing-along chorus",
    syllables: "6-10 syllables per line (singable, clear phrasing)",
    bpm: "110-120 BPM",
  },
  reggaeton: {
    style: "reggaeton with Latin rhythm, dembow beat feel, and playful flow",
    syllables: "8-12 syllables per line (rhythmic, danceable flow)",
    bpm: "90-100 BPM",
  },
  country: {
    style: "country with twangy storytelling, humor, and a honky-tonk vibe",
    syllables: "6-10 syllables per line (conversational, storytelling pace)",
    bpm: "100-110 BPM",
  },
  rock: {
    style: "punk rock with aggressive energy, power chords feel, and raw attitude",
    syllables: "6-10 syllables per line (punchy, shout-ready)",
    bpm: "140-160 BPM",
  },
  edm: {
    style: "EDM/electronic with a drop, synth vibes, and danceable energy",
    syllables: "4-8 syllables per line (short, chant-like, repetitive)",
    bpm: "125-130 BPM",
  },
  rnb: {
    style: "smooth R&B with soulful vocals, groovy bassline, and silky melodies",
    syllables: "6-10 syllables per line (smooth, melodic flow)",
    bpm: "85-95 BPM",
  },
  trap: {
    style: "trap with heavy 808 bass, hi-hat rolls, dark energy, and aggressive delivery",
    syllables: "8-14 syllables per line (fast triplet flow, hard-hitting)",
    bpm: "130-150 BPM",
  },
  jazz: {
    style: "jazz/swing with smooth saxophone feel, walking bassline, and witty lounge delivery",
    syllables: "6-10 syllables per line (conversational, swinging rhythm)",
    bpm: "110-130 BPM",
  },
  afrobeat: {
    style: "afrobeat with infectious rhythm, percussive groove, and joyful danceable energy",
    syllables: "6-10 syllables per line (rhythmic, percussive flow)",
    bpm: "100-120 BPM",
  },
  kpop: {
    style: "K-pop with catchy hook, polished production, and addictive chorus",
    syllables: "6-10 syllables per line (tight, catchy phrasing)",
    bpm: "115-130 BPM",
  },
  metal: {
    style: "heavy metal with aggressive vocals, distorted guitars, and raw power",
    syllables: "6-10 syllables per line (aggressive, shout-ready)",
    bpm: "140-180 BPM",
  },
};

const ROAST_LEVELS: Record<string, string> = {
  funny:
    "Make it HILARIOUS — pure comedy, absurd comparisons, over-the-top silly. Like a stand-up comedian roasting a friend at a birthday party. The goal is everyone laughing, nobody hurt. Exaggerate everything. No actual burns, just comedy gold.",
  hard:
    "Friendly roast with some edge — playful teasing, gentle burns, affectionate jabs. Like friends joking around. Clever wordplay, funny comparisons, lighthearted but pointed.",
  extreme:
    "Savage roast — clever burns, brutal honesty, comedy roast show level. Witty, cutting, no holding back. However: NO hate speech, NO slurs, NO attacks on appearance/race/gender/disability. Channel the savagery through CREATIVITY and WIT.",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: `Write in English only.
- Use simple, common words that are easy to pronounce
- Avoid abbreviations, acronyms, or words with silent letters
- Prefer one-word or two-syllable rhymes (e.g., "day/way", "name/shame")`,
  ru: `Write ALL lyrics in Russian (Cyrillic). The entire song must be in Russian.
CRITICAL RULES FOR RUSSIAN:
- Use ONLY simple 2-3 syllable words with obvious, unambiguous stress
- NEVER use words where stress changes meaning (замок, мука, белки, стрелки, etc.)
- Each line: maximum 6-8 simple words
- Prefer words ending in -ать, -ить, -ой, -ая, -ение
- Use natural colloquial Russian, short punchy phrases
- Do NOT use English words written in Cyrillic
- Do NOT use complex compound words or bureaucratic vocabulary
- Rhymes must be clean and obvious: -ать/-ать, -ой/-ой, -ил/-ил, -ать/-ять
- Think of how Тимати or Баста would write — simple, street, rhythmic`,
  es: `Write ALL lyrics in Spanish. The entire song must be in Spanish.
- Use natural Spanish slang and wordplay
- Prefer words with clear vowel endings for clean rhymes
- Avoid complex conjugations — keep it conversational
- Use Rioplatense or neutral Latin American Spanish`,
};

export async function generateLyrics({
  name,
  facts,
  genre,
  roastLevel = "funny",
  language = "en",
}: LyricsRequest): Promise<string> {
  const config = GENRE_CONFIG[genre] || GENRE_CONFIG.hiphop;
  const levelInstructions = ROAST_LEVELS[roastLevel] || ROAST_LEVELS.funny;
  const langInstructions = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
  const factsText = facts.map((f, i) => `${i + 1}. ${f}`).join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are a songwriter for a 1-minute AI-sung roast track. The AI voice sings the lyrics — you must write for SINGING, not reading.

TARGET PERSON: "${name}"

GENDER: Determine the gender from the name "${name}".
- If the name is clearly feminine (e.g., Sarah, Мария, Анна, Jessica) → use she/her pronouns. For Russian: use feminine verb forms (-ла, -ает) and feminine adjectives (-ая, -ная).
- If the name is clearly masculine (e.g., Kevin, Дмитрий, Mike) → use he/him pronouns. For Russian: use masculine verb forms (-л, -ает) and masculine adjectives (-ой, -ный).
- If ambiguous → default to he/him (masculine).
THIS IS CRITICAL — wrong gender ruins the song.

FACTS ABOUT THEM:
${factsText}

MUSIC STYLE: ${config.style} (${config.bpm})

ROAST TONE: ${levelInstructions}

CRITICAL SONGWRITING RULES:

1. STRUCTURE — exactly 4 sections (for a ~1 minute song):
   Verse 1 (4 lines)
   Chorus (4 lines)
   Verse 2 (4 lines)
   Chorus (repeat the EXACT same 4 lines from the first Chorus)

   You write 12 UNIQUE lines total. The second Chorus is a copy of the first.

2. RHYTHM — every line must have ${config.syllables}. Count your syllables! Lines that are too long will sound rushed. Lines that are too short will have awkward pauses.

3. RHYME SCHEME — use AABB (line 1 rhymes with line 2, line 3 rhymes with line 4). End-rhymes must be STRONG and OBVIOUS — the listener should immediately hear the rhyme.

4. SINGABILITY — this will be sung by an AI voice:
   - Use simple, common words (no jargon, no abbreviations)
   - Avoid tongue-twisters or consonant clusters
   - End lines on strong vowel sounds when possible
   - Each line should be one natural breath phrase
   - The chorus should feel like a chant people can repeat

5. CONTENT:
   - Verse 1: introduce ${name}, set the scene, reference 1-2 facts
   - Chorus: the catchy hook everyone remembers — use "${name}" here
   - Verse 2: dig deeper, reference remaining facts, build on the roast
   - Reference the facts creatively across both verses
   - Use "${name}" at least 3 times across the whole song
   - Make the chorus the most fun part to sing along to

6. LANGUAGE:
${langInstructions}

OUTPUT FORMAT — write ONLY the lyrics, nothing else:

Verse 1
(line 1)
(line 2)
(line 3)
(line 4)

Chorus
(line 1)
(line 2)
(line 3)
(line 4)

Verse 2
(line 1)
(line 2)
(line 3)
(line 4)

Chorus
(line 1)
(line 2)
(line 3)
(line 4)`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No lyrics generated");
  }

  return textBlock.text;
}
