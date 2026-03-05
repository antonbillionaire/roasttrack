/**
 * Batch generate tracks for TikTok/Reels content.
 *
 * Usage: npx tsx scripts/batch-generate.ts
 *
 * Requires env vars: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY
 * Copy from .env.local: cp .env.local .env && npx tsx scripts/batch-generate.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

// Track recipes — diverse names, facts, genres, levels
const TRACKS = [
  // --- RELATABLE FRIEND HABITS ---
  {
    name: "Kevin",
    facts: ["always 30 minutes late to everything", "says 'on my way' while still in bed", "has never returned a borrowed hoodie"],
    genre: "hiphop",
    roastLevel: "funny",
    language: "en",
    hook: "My friend Kevin has NEVER been on time in his life...",
  },
  {
    name: "Sarah",
    facts: ["takes 45 minutes to pick a restaurant then says 'I don't care'", "screenshots every conversation", "has 47 unread group chat messages"],
    genre: "pop",
    roastLevel: "hard",
    language: "en",
    hook: "Sarah screenshots EVERYTHING... so I made her a song",
  },
  {
    name: "Mike",
    facts: ["plays DJ at every party but nobody asked", "has 12 Spotify playlists named 'vibes'", "thinks he discovered every song first"],
    genre: "edm",
    roastLevel: "extreme",
    language: "en",
    hook: "Nobody asked Mike to be the DJ... but here we are",
  },
  {
    name: "Jessica",
    facts: ["posts 'good vibes only' but is the most dramatic person alive", "has a new life crisis every week", "blocked her ex 6 times this month"],
    genre: "rnb",
    roastLevel: "hard",
    language: "en",
    hook: "Jessica posts 'good vibes only' but has a crisis EVERY week",
  },
  {
    name: "Tyler",
    facts: ["wears the same gym shorts everywhere including weddings", "says 'bro' every other word", "thinks protein powder fixes everything"],
    genre: "rock",
    roastLevel: "funny",
    language: "en",
    hook: "Tyler wore gym shorts to a WEDDING... AI wrote him a song",
  },
  {
    name: "Emily",
    facts: ["starts every sentence with 'not to be dramatic but'", "has cried at every movie including Fast and Furious", "sends 14 texts in a row instead of one paragraph"],
    genre: "country",
    roastLevel: "funny",
    language: "en",
    hook: "Emily cried during Fast and Furious... twice",
  },
  {
    name: "Brandon",
    facts: ["owes everyone money but just bought new AirPods", "always says 'I got you next time' at dinner", "has venmo requests from 2023 still pending"],
    genre: "reggaeton",
    roastLevel: "extreme",
    language: "en",
    hook: "Brandon owes me $40 but just bought new AirPods...",
  },
  {
    name: "Olivia",
    facts: ["takes 200 photos to post one selfie", "her phone storage is always full", "asks 'does this look good?' then ignores your answer"],
    genre: "kpop",
    roastLevel: "funny",
    language: "en",
    hook: "Olivia takes 200 photos for ONE selfie... AI noticed",
  },
  {
    name: "Jake",
    facts: ["falls asleep at every hangout by 10pm", "says 'I'm not tired' with his eyes closed", "has canceled plans 3 weekends in a row"],
    genre: "afrobeat",
    roastLevel: "hard",
    language: "en",
    hook: "Jake falls asleep at 10pm... at the PARTY",
  },
  {
    name: "Ashley",
    facts: ["talks about her horoscope like it's a medical diagnosis", "blames everything on Mercury retrograde", "won't date you if you're a Gemini"],
    genre: "pop",
    roastLevel: "extreme",
    language: "en",
    hook: "Ashley rejected a guy because he's a GEMINI...",
  },

  // --- RUSSIAN TRACKS ---
  {
    name: "Дима",
    facts: ["говорит 'щас буду' а приходит через час", "ест из чужого холодильника как из своего", "обещал вернуть деньги в понедельник уже третий месяц"],
    genre: "hiphop",
    roastLevel: "funny",
    language: "ru",
    hook: "Дима 'щас будет' уже третий час...",
  },
  {
    name: "Настя",
    facts: ["фоткает еду перед тем как есть", "сторис каждые 5 минут", "говорит 'я не фотогеничная' на 500 фотке"],
    genre: "pop",
    roastLevel: "hard",
    language: "ru",
    hook: "Настя фоткает еду 10 минут... суп уже холодный",
  },

  // --- SPANISH TRACKS ---
  {
    name: "Carlos",
    facts: ["dice 'ya voy' y todavia esta en la cama", "siempre pide un trago de tu bebida y se la toma toda", "tiene 300 matches en Tinder pero no habla con nadie"],
    genre: "reggaeton",
    roastLevel: "funny",
    language: "es",
    hook: "Carlos dice 'ya voy' pero sigue en la cama...",
  },
];

// Video description templates for TikTok/Reels
const DESCRIPTIONS = [
  "AI wrote a roast song about my friend and it's BRUTAL {emoji} #roasttrack #ai #disstrack #funny #roast",
  "Made an AI diss track about {name} and I can't stop laughing {emoji} #roasttrack #aigenerated #comedy",
  "This AI roast song about my friend is TOO accurate {emoji} #roasttrack #disstrack #ai #viral",
  "I let AI write a song about my friend's worst habits {emoji} #roasttrack #funny #aimusic #roasted",
  "POV: AI turns your friend's annoying habits into a hit song {emoji} #roasttrack #ai #comedy #music",
  "My friend is gonna HATE me for this AI diss track {emoji} #roasttrack #disstrack #friendship #funny",
  "When AI knows your friend better than you do {emoji} #roasttrack #accurate #aimusic #roast",
  "AI wrote the most SAVAGE roast song about {name} {emoji} #roasttrack #brutal #ai #disstrack",
];

const EMOJIS = ["💀", "🔥", "😭", "☠️", "😈", "🤣", "😂", "💀🔥"];
const PINNED_COMMENTS = [
  "Try it yourself: roasttrack.com 🔥",
  "Make one for YOUR friend: roasttrack.com",
  "Who should I roast next? Drop names below 👇 roasttrack.com",
  "This is what happens when AI knows too much 💀 roasttrack.com",
];

async function generateTrack(track: typeof TRACKS[0], index: number) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Track ${index + 1}/${TRACKS.length}: ${track.name} (${track.genre}, ${track.language})`);
  console.log(`${"=".repeat(50)}`);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: track.name,
        facts: track.facts,
        genre: track.genre,
        roastLevel: track.roastLevel,
        language: track.language,
        adminSecret: process.env.ADMIN_SECRET,
        durationSeconds: 30, // Short tracks for video content
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  FAILED: ${res.status} ${err}`);
      return null;
    }

    const data = await res.json();
    const trackUrl = `https://roasttrack.com/track/${data.id}`;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const mp3Url = `${supabaseUrl}/storage/v1/object/public/tracks/${data.id}.mp3`;

    // Generate video metadata
    const descTemplate = DESCRIPTIONS[index % DESCRIPTIONS.length];
    const emoji = EMOJIS[index % EMOJIS.length];
    const description = descTemplate
      .replace("{name}", track.name)
      .replace("{emoji}", emoji);
    const pinnedComment = PINNED_COMMENTS[index % PINNED_COMMENTS.length];

    console.log(`  URL: ${trackUrl}`);
    console.log(`  MP3: ${mp3Url}`);
    console.log(`  Hook: "${track.hook}"`);
    console.log(`  Description: ${description}`);
    console.log(`  Pinned: ${pinnedComment}`);

    return {
      name: track.name,
      genre: track.genre,
      language: track.language,
      url: trackUrl,
      mp3: mp3Url,
      hook: track.hook,
      description,
      pinnedComment,
    };
  } catch (err) {
    console.error(`  ERROR: ${err}`);
    return null;
  }
}

async function main() {
  console.log("🔥 RoastTrack Batch Generator");
  console.log(`Generating ${TRACKS.length} tracks...\n`);

  const results = [];

  for (let i = 0; i < TRACKS.length; i++) {
    const result = await generateTrack(TRACKS[i], i);
    if (result) results.push(result);

    // Small delay between requests
    if (i < TRACKS.length - 1) {
      console.log("  Waiting 5s before next track...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // Summary
  console.log(`\n\n${"🔥".repeat(25)}`);
  console.log(`\nSUMMARY: ${results.length}/${TRACKS.length} tracks generated\n`);

  for (const r of results) {
    console.log(`${r.name} (${r.genre}) — ${r.url}`);
    console.log(`  MP3:  ${r.mp3}`);
    console.log(`  Hook: ${r.hook}`);
    console.log(`  Desc: ${r.description}`);
    console.log(`  Pin:  ${r.pinnedComment}\n`);
  }
}

main().catch(console.error);
