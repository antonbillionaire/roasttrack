import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface LyricsRequest {
  name: string;
  facts: string[];
  genre: string;
}

const GENRE_STYLES: Record<string, string> = {
  hiphop: "hip-hop/rap with hard-hitting bars, clever wordplay, and a bouncy beat feel",
  pop: "catchy pop with a memorable hook, upbeat rhythm, and sing-along chorus",
  reggaeton: "reggaeton with Latin rhythm, dembow beat feel, and playful flow",
  country: "country with twangy storytelling, humor, and a honky-tonk vibe",
  rock: "punk rock with aggressive energy, power chords feel, and raw attitude",
  edm: "EDM/electronic with a drop, synth vibes, and danceable energy",
};

export async function generateLyrics({ name, facts, genre }: LyricsRequest): Promise<string> {
  const style = GENRE_STYLES[genre] || GENRE_STYLES.hiphop;
  const factsText = facts.map((f, i) => `${i + 1}. ${f}`).join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Write a funny roast/diss track about a person named "${name}".

Here are facts about them:
${factsText}

Style: ${style}

Rules:
- Write ONLY the song lyrics, nothing else
- Include a Verse 1, Chorus, and Verse 2
- Make it funny, clever, and savage but not mean-spirited or offensive
- Reference ALL the facts provided in creative ways
- Use the person's name at least 2-3 times
- Keep it clean (no profanity, slurs, or truly hurtful content)
- Each section should be 4-8 lines
- Make the chorus catchy and repeatable
- Write in English only`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No lyrics generated");
  }

  return textBlock.text;
}
