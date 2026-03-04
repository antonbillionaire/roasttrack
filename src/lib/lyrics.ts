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
  light:
    "Keep it light and playful — friendly teasing, gentle jokes, the kind of roast you'd do at a birthday party. Think wholesome humor, silly comparisons, and affectionate jabs. No harsh words.",
  hard:
    "Go hard — savage roast with clever burns, brutal honesty, and no holding back. Think comedy roast show level. Witty, cutting, but still clever rather than crude. No profanity or slurs.",
  extreme:
    "Maximum brutality — absolutely devastating bars, career-ending level roast. The most creative and savage wordplay possible. Scorched earth. However: NO hate speech, NO slurs, NO truly personal attacks on appearance/race/gender/disability. Channel the savagery through CREATIVITY and WIT, not through crossing ethical lines.",
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
  roastLevel = "hard",
  language = "en",
}: LyricsRequest): Promise<string> {
  const style = GENRE_STYLES[genre] || GENRE_STYLES.hiphop;
  const levelInstructions = ROAST_LEVELS[roastLevel] || ROAST_LEVELS.hard;
  const langInstructions = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
  const factsText = facts.map((f, i) => `${i + 1}. ${f}`).join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `Write a roast/diss track about a person named "${name}".

Here are facts about them:
${factsText}

Style: ${style}

Roast level: ${levelInstructions}

Rules:
- Write ONLY the song lyrics, nothing else
- Include a Verse 1, Chorus, and Verse 2
- Reference ALL the facts provided in creative ways
- Use the person's name at least 2-3 times
- Each section should be 4-8 lines
- Make the chorus catchy and repeatable
- ${langInstructions}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No lyrics generated");
  }

  return textBlock.text;
}
