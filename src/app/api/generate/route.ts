import { NextRequest, NextResponse } from "next/server";
import { generateLyrics } from "@/lib/lyrics";
import { generateMusic } from "@/lib/music";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, facts, genre } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!Array.isArray(facts)) {
      return NextResponse.json({ error: "Facts must be an array" }, { status: 400 });
    }
    const validFacts = facts.filter((f: string) => typeof f === "string" && f.trim());
    if (validFacts.length === 0) {
      return NextResponse.json({ error: "At least one fact is required" }, { status: 400 });
    }

    // 1. Generate lyrics with Claude
    console.log("Generating lyrics...");
    const lyrics = await generateLyrics({
      name: name.trim(),
      facts: validFacts.map((f: string) => f.trim()),
      genre: genre || "hiphop",
    });
    console.log("Lyrics generated successfully");

    // 2. Generate music with ElevenLabs
    console.log("Generating music...");
    const audioBuffer = await generateMusic(lyrics, genre || "hiphop");
    console.log("Music generated, size:", audioBuffer.length, "bytes");

    // 3. Upload to Supabase Storage
    const id = crypto.randomUUID();

    // Ensure bucket exists (ignore "already exists" error)
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

    // Get public URL
    const {
      data: { publicUrl: audioUrl },
    } = supabaseAdmin.storage.from("tracks").getPublicUrl(`${id}.mp3`);

    // Save metadata
    const metadata = {
      id,
      name: name.trim(),
      facts: validFacts,
      genre: genre || "hiphop",
      lyrics,
      audioUrl,
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

    console.log("Track created:", id);
    return NextResponse.json({ id });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
