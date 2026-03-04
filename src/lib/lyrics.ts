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

const GENRE_STYLES: Record<string, string> = {
  hiphop: "hip-hop/rap with hard-hitting bars, clever wordplay, and a bouncy beat feel",
  pop: "catchy pop with a memorable hook, upbeat rhythm, and sing-along chorus",
  reggaeton: "reggaeton with Latin rhythm, dembow beat feel, and playful flow",
  country: "country with twangy storytelling, humor, and a honky-tonk vibe",
  rock: "punk rock with aggressive energy, power chords feel, and raw attitude",
  edm: "EDM/electronic with a drop, synth vibes, and danceable energy",
};

const ROAST_LEVELS: Record<string, string> = {
  funny:
    "Make it HILARIOUS — pure comedy, absurd comparisons, over-the-top silly. Like a stand-up comedian roasting a friend at a birthday party. The goal is everyone laughing, nobody hurt. Think of the funniest, most ridiculous comparisons. Exaggerate everything. No actual burns, just comedy gold.",
  hard:
    "Friendly roast with some edge — playful teasing, gentle burns, affectionate jabs. Like friends joking around. Clever wordplay, funny comparisons, lighthearted but pointed. No harsh words or truly mean content.",
  extreme:
    "Savage roast — clever burns, brutal honesty, comedy roast show level. Witty, cutting, no holding back. However: NO hate speech, NO slurs, NO attacks on appearance/race/gender/disability. Channel the savagery through CREATIVITY and WIT.",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Write in English only.",
  ru: "Write ALL lyrics in Russian (Cyrillic). The entire song must be in Russian — verses, chorus, everything. Use natural Russian slang and wordplay.",
  es: "Write ALL lyrics in Spanish. The entire song must be in Spanish. Use natural Spanish slang and wordplay.",
};

export async function generateLyrics({
  name,
  facts,
  genre,
  roastLevel = "funny",
  language = "en",
}: LyricsRequest): Promise<string> {
  const style = GENRE_STYLES[genre] || GENRE_STYLES.hiphop;
  const levelInstructions = ROAST_LEVELS[roastLevel] || ROAST_LEVELS.funny;
  const langInstructions = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
  const factsText = facts.map((f, i) => `${i + 1}. ${f}`).join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Write a SHORT roast/diss track about "${name}".

Facts about them:
${factsText}

Style: ${style}

Tone: ${levelInstructions}

CRITICAL FORMAT RULES:
- Write ONLY lyrics, no explanations
- EXACTLY 2 sections: Verse and Chorus
- Verse: EXACTLY 4 lines
- Chorus: EXACTLY 4 lines
- Total: 8 lines of lyrics ONLY
- This is for a 30-second song — keep it SHORT and punchy
- Reference the facts creatively
- Use "${name}" at least twice
- Make the chorus catchy and memorable
- ${langInstructions}

Format:
Verse
(4 lines here)

Chorus
(4 lines here)`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No lyrics generated");
  }

  return textBlock.text;
}
