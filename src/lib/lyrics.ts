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

// Genre-specific style guidance with reference songwriters
const GENRE_CONFIG: Record<string, { style: string; bpm: string; references: string }> = {
  hiphop: {
    style: "hip-hop/rap with hard-hitting bars, clever wordplay, bouncy beat, and confident delivery",
    bpm: "90-100",
    references: "Eminem (razor-sharp wordplay, multi-syllabic rhymes, comedic storytelling), Kendrick Lamar (layered metaphors, rhythmic precision, narrative depth), Drake (catchy melodic hooks, quotable punchlines, effortless flow)",
  },
  pop: {
    style: "catchy pop with a memorable hook, upbeat rhythm, bright melody, and sing-along chorus",
    bpm: "110-120",
    references: "Max Martin (bulletproof song structure, irresistible hooks, every syllable singable), Ed Sheeran (conversational storytelling that becomes a chant, simple words with emotional punch), Sia (powerful emotional build, anthemic chorus, raw vocal energy)",
  },
  reggaeton: {
    style: "reggaeton with dembow rhythm, Latin groove, playful flow, and danceable bounce",
    bpm: "90-100",
    references: "Bad Bunny (playful wordplay, unexpected metaphors, genre-bending creativity), Daddy Yankee (rhythmic precision on dembow, crowd-chant hooks, raw street energy), J Balvin (minimalist catchy phrases, sing-along simplicity, infectious repetition)",
  },
  country: {
    style: "country with twangy storytelling, humor, acoustic guitar feel, and honky-tonk vibe",
    bpm: "100-110",
    references: "Toby Keith (witty humor, patriotic swagger, crowd-sing choruses), Dolly Parton (brilliant storytelling, clever wordplay wrapped in simplicity, emotional truth), Chris Stapleton (raw honest lyrics, soulful phrasing, every word lands heavy)",
  },
  rock: {
    style: "punk rock with aggressive energy, power chords feel, raw attitude, and shoutable chorus",
    bpm: "140-160",
    references: "Billie Joe Armstrong/Green Day (fast punk anthems, shoutable one-line hooks, raw teenage energy), Dave Grohl/Foo Fighters (massive arena choruses, emotional intensity, singable aggression), Freddie Mercury/Queen (theatrical builds, crowd-participation hooks, legendary phrasing)",
  },
  edm: {
    style: "EDM/electronic with a synth drop, build-up energy, danceable beat, and chant-like vocals",
    bpm: "125-130",
    references: "David Guetta (anthemic topline vocals, euphoric build-drop structure, festival-ready phrases), Skrillex (rhythmic vocal chops, minimal but punchy lyrics, drop-oriented energy), Calvin Harris (pop-crossover hooks, simple sing-along melodies, summer-anthem feel)",
  },
  rnb: {
    style: "smooth R&B with soulful vocals, groovy bassline, silky melodies, and laid-back groove",
    bpm: "85-95",
    references: "The Weeknd (dark atmospheric storytelling, falsetto hooks, cinematic mood), Frank Ocean (poetic vulnerability, unexpected imagery, stream-of-consciousness flow), SZA (conversational honesty, melodic runs, relatable emotional detail)",
  },
  afrobeat: {
    style: "afrobeat with infectious polyrhythmic groove, percussive energy, horn-like melodies, and joyful dance feel",
    bpm: "100-120",
    references: "Burna Boy (commanding vocal presence, Pidgin-English swagger, global Afrofusion storytelling), Wizkid (effortless melodic flow, minimal but catchy phrases, smooth romantic hooks), Fela Kuti (call-and-response chants, socially charged repetition, hypnotic groove lyrics)",
  },
  kpop: {
    style: "K-pop with bright synth-pop production, addictive dance-pop chorus, rapid-fire verse, and polished idol-group energy",
    bpm: "115-130",
    references: "Teddy Park/BLACKPINK (fierce rap-sing switch, badass one-liners, addictive chant hooks), Bang Si-hyuk/BTS (emotional storytelling over dance beats, fan-chant-ready phrases, motivational energy), JYP/TWICE (ultra-catchy repeated hooks, aegyo charm, point-choreography lyrics)",
  },
};

const ROAST_LEVELS: Record<string, string> = {
  funny:
    "This is a COMEDY ROAST — pure laughs, absurd exaggerations, over-the-top silly comparisons. Like a stand-up comedian at a friend's birthday party. Everyone is laughing, nobody is hurt. The goal is to make the listener CRACK UP. Exaggerate everything to ridiculous extremes.",
  hard:
    "This is a SPICY ROAST — playful teasing with real edge, clever burns, affectionate but pointed jabs. Like friends trash-talking each other. Clever wordplay, funny but cutting comparisons. The target should laugh AND wince.",
  extreme:
    "This is a SAVAGE ROAST — brutal honesty, razor-sharp wit, comedy roast show level. No holding back. However: NO hate speech, NO slurs, NO attacks on appearance/race/gender/disability. Channel ALL savagery through CREATIVITY and WIT — the smarter the burn, the harder it hits.",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: `LANGUAGE: ENGLISH
- Use simple, common words that are easy to sing
- Avoid abbreviations, acronyms, or words with silent letters
- Prefer clean one-syllable or two-syllable rhymes (e.g., "day/way", "name/shame", "friend/end")
- Every line must sound natural when spoken out loud`,
  ru: `LANGUAGE: RUSSIAN (Cyrillic only, zero English words)

WORD CHOICE:
- Maximum 6-8 words per line (Verse), 4-6 words per line (Chorus)
- Use ONLY simple 2-3 syllable words with obvious, unambiguous stress
- BANNED words (ambiguous stress): замок, мука, белки, стрелки, писать, атлас, орган, хаос, ирис
- Preferred word endings: -ать, -ить, -ой, -ая, -ул, -ал, -ом
- Style reference: Тимати, Баста, Oxxxymiron — street, punchy, colloquial
- Natural spoken Russian — not textbook, not formal
- Do NOT use English words written in Cyrillic
- Do NOT use complex compound words or bureaucratic vocabulary

GENDER ENFORCEMENT (check EVERY line):
- FEMININE: прошла, сделала, она такая, крутая девушка
- MASCULINE: прошёл, сделал, он такой, крутой парень
- Every verb, adjective, and participle must match the target's gender

RHYME REQUIREMENTS:
- Pure rhymes only: -ать/-ать, -ой/-ой, -ил/-ил, -ул/-ул, -ала/-ала
- No approximate rhymes — rhyming words must share stressed vowel + following sounds`,
  es: `LANGUAGE: SPANISH (zero English words)
- Use natural Latin American Spanish slang and wordplay
- Prefer words with clear vowel endings for clean rhymes
- Avoid complex conjugations — keep it conversational
- Style: reggaeton/urban flow, colloquial, street`,
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
    model: "claude-sonnet-4-5-20241022",
    max_tokens: 1000,
    system: `You are RoastMaster — the world's greatest comedy roast songwriter. You've written #1 hits for every genre. Your superpower: turning mundane personal facts into DEVASTATING comedy gold that people can't stop singing.

Your rules:
- You write BANGERS. Every line must hit hard — either funny or catchy, ideally both
- You think in RHYTHM first. You tap the beat before writing a single word
- Your choruses get stuck in people's heads for DAYS
- You never write generic filler lines. Every bar earns its place
- You match the EXACT energy of the genre — a country roast sounds NOTHING like a hip-hop roast
- You study the reference artists below and channel their specific songwriting techniques

REFERENCE SONGWRITERS for this track's genre:
${config.references}

Study these artists' techniques: their rhyme patterns, hook structures, rhythmic choices, and what makes their songs memorable. Channel their energy into this roast track.`,
    messages: [
      {
        role: "user",
        content: `Write lyrics for a 1-minute AI-sung ROAST track. The AI voice will SING these lyrics — write for SINGING, not reading.

TARGET PERSON: "${name}"

════════════════════════════════════
STEP 1 — GENDER (determine BEFORE writing)
════════════════════════════════════

Analyze the name "${name}":
- FEMININE (Sarah, Мария, Anna, Катя, Jessica, Лена, Sofia, Ольга) → she/her
- MASCULINE (Kevin, Дмитрий, Mike, Алексей, James, Иван, David, Сергей) → he/him
- AMBIGUOUS → default MASCULINE

⚠️ LOCK the gender. Every pronoun, verb form, and adjective in the ENTIRE song must match.

════════════════════════════════════
STEP 2 — SONG PARAMETERS
════════════════════════════════════

FACTS ABOUT THEM:
${factsText}

MUSIC STYLE: ${config.style}
BPM: ${config.bpm}

ROAST TONE: ${levelInstructions}

════════════════════════════════════
STEP 3 — RHYTHM & TEMPO
════════════════════════════════════

BPM controls syllables per line. Use this table:

| BPM     | Verse syllables | Chorus syllables |
|---------|-----------------|------------------|
| 60–99   | 8–10            | 6–8              |
| 100–119 | 10–12           | 7–9              |
| 120–139 | 12–14           | 9–11             |
| 140+    | 14–16           | 11–13            |

Apply strictly for BPM ${config.bpm}. COUNT syllables in every line.
Chorus lines are always 20-30% SHORTER than Verse lines.

════════════════════════════════════
STEP 4 — STRUCTURE & TRANSITIONS
════════════════════════════════════

Write exactly 12 UNIQUE lines:

Verse 1 (4 lines) — introduce "${name}", set scene, reference facts 1-2
Chorus  (4 lines) — catchy hook, use "${name}", singable chant
Verse 2 (4 lines) — dig deeper, remaining facts, escalate the roast
Chorus  (copy-paste the EXACT same 4 lines from first Chorus)

Use "${name}" minimum 3 times across the full song.

TRANSITION RULES:
- Line 4 of every Verse must be SHORT (max 6 syllables) and feel FINAL
- Chorus Line 1 MUST start with "${name}" or an exclamation (Oh!, Hey!, Yeah!)
- Chorus = STACCATO, PUNCHY — each word lands like a chant people yell back
- Verse = conversational, flowing, storytelling
- The contrast between Verse and Chorus must be obvious

════════════════════════════════════
STEP 5 — RHYME & SINGABILITY
════════════════════════════════════

RHYME: AABB per section (lines 1-2 rhyme, lines 3-4 rhyme)
- Rhymes must be OBVIOUS on first listen
- End lines on strong vowel sounds when possible
- Each line = one natural breath phrase
- No tongue-twisters, no consonant clusters, no abbreviations
- The chorus must feel like something a crowd can yell back

════════════════════════════════════
STEP 6 — LANGUAGE
════════════════════════════════════

${langInstructions}

════════════════════════════════════
OUTPUT — write ONLY the lyrics, nothing else:
════════════════════════════════════

Verse 1
[line 1]
[line 2]
[line 3]
[line 4]

Chorus
[line 1]
[line 2]
[line 3]
[line 4]

Verse 2
[line 1]
[line 2]
[line 3]
[line 4]

Chorus
[line 1]
[line 2]
[line 3]
[line 4]`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No lyrics generated");
  }

  return textBlock.text;
}
