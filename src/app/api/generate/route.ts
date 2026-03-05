import { NextRequest, NextResponse } from "next/server";
import { generateLyrics } from "@/lib/lyrics";
import { generateMusic } from "@/lib/music";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserByToken, deductCredit, recordGeneration, countFreePreviewsToday } from "@/lib/db";
import { rateLimit, getIP } from "@/lib/rate-limit";

const MAX_FREE_PREVIEWS_PER_DAY = 1;
const MAX_NAME_LENGTH = 50;
const MAX_FACT_LENGTH = 150;
const MAX_FACTS = 5;
const ADMIN_EMAILS = ["anton.v.melnikov@gmail.com"];

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 requests per minute per IP (burst protection)
    const ip = getIP(req.headers);
    const { allowed } = rateLimit(`generate:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Slow down!" }, { status: 429 });
    }

    const body = await req.json();
    const { name, facts, genre, roastLevel, language, accessToken, durationSeconds, adminSecret } = body;

    // Input validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }
    if (!Array.isArray(facts) || facts.length > MAX_FACTS) {
      return NextResponse.json({ error: "Invalid facts" }, { status: 400 });
    }
    const validFacts = facts
      .filter((f: string) => typeof f === "string" && f.trim())
      .map((f: string) => f.trim().slice(0, MAX_FACT_LENGTH));
    if (validFacts.length === 0) {
      return NextResponse.json({ error: "At least one fact is required" }, { status: 400 });
    }

    // Admin bypass via secret key (for batch scripts)
    const isAdminBySecret = adminSecret && process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET;

    // Check credits: if accessToken provided, deduct credit; otherwise free preview
    let userId: string | null = null;
    let isFreePreview = true;
    let isAdmin = !!isAdminBySecret;

    if (isAdminBySecret) {
      // Admin via secret — no token needed, no credits deducted
      isFreePreview = false;
    } else if (accessToken) {
      const user = await getUserByToken(accessToken);
      if (!user) {
        return NextResponse.json({ error: "Invalid access token" }, { status: 401 });
      }
      isAdmin = ADMIN_EMAILS.includes(user.email);
      if (!isAdmin) {
        if (user.credits_remaining < 1) {
          return NextResponse.json(
            { error: "No credits remaining. Buy a pack to generate more tracks!" },
            { status: 402 }
          );
        }
        const deducted = await deductCredit(user.id);
        if (!deducted) {
          return NextResponse.json({ error: "Failed to deduct credit" }, { status: 402 });
        }
      }
      userId = user.id;
      isFreePreview = false;
    } else {
      // Free preview — enforce daily IP limit
      const todayCount = await countFreePreviewsToday(ip);
      if (todayCount >= MAX_FREE_PREVIEWS_PER_DAY) {
        return NextResponse.json(
          { error: "Free preview limit reached! Buy credits to generate more tracks." },
          { status: 429 }
        );
      }
    }

    // Admin can request custom duration (e.g. 30s for video content)
    const duration = isAdmin && durationSeconds ? durationSeconds : 60;

    // 1. Generate lyrics with Claude
    console.log(`Generating lyrics... (${duration}s track)`);
    const lyrics = await generateLyrics({
      name: name.trim(),
      facts: validFacts.map((f: string) => f.trim()),
      genre: genre || "hiphop",
      roastLevel: roastLevel || "funny",
      language: language || "en",
      durationSeconds: duration,
    });
    console.log("Lyrics generated successfully");
    console.log(`Generating music... (${duration}s)`);
    const audioBuffer = await generateMusic(lyrics, genre || "hiphop", duration);
    console.log("Music generated, size:", audioBuffer.length, "bytes");

    // 3. Upload to Supabase Storage
    const id = crypto.randomUUID();

    // Ensure bucket exists (public for permanent share links)
    await supabaseAdmin.storage
      .createBucket("tracks", { public: true })
      .catch(() => {});

    // Upload audio
    const { error: audioErr } = await supabaseAdmin.storage
      .from("tracks")
      .upload(`${id}.mp3`, audioBuffer, { contentType: "audio/mpeg" });

    if (audioErr) {
      console.error("Audio upload error:", audioErr);
      throw new Error(`Audio upload failed: ${audioErr.message}`);
    }

    // Get public URL (permanent, no expiry)
    const { data: publicData } = supabaseAdmin.storage
      .from("tracks")
      .getPublicUrl(`${id}.mp3`);

    const audioUrl = publicData.publicUrl;

    // Save metadata (no userId for privacy)
    const metadata = {
      id,
      name: name.trim(),
      facts: validFacts,
      genre: genre || "hiphop",
      roastLevel: roastLevel || "funny",
      language: language || "en",
      lyrics,
      audioUrl,
      isFreePreview,
      createdAt: new Date().toISOString(),
    };

    const { error: metaErr } = await supabaseAdmin.storage
      .from("tracks")
      .upload(`${id}.json`, Buffer.from(JSON.stringify(metadata)), {
        contentType: "application/json",
      });

    if (metaErr) {
      console.error("Metadata upload error:", metaErr);
      throw new Error(`Metadata upload failed: ${metaErr.message}`);
    }

    // Record generation in DB
    await recordGeneration(
      userId,
      id,
      name.trim(),
      genre || "hiphop",
      roastLevel || "funny",
      language || "en",
      isFreePreview,
      ip
    );

    console.log("Track created:", id, isFreePreview ? "(preview)" : "(paid)");
    return NextResponse.json({ id, isFreePreview });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
