import { NextRequest, NextResponse } from "next/server";
import { getUserByToken, deductCredit } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const ip = getIP(req.headers);
  const { allowed } = rateLimit(`unlock:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { trackId, accessToken } = await req.json();

    if (!trackId || typeof trackId !== "string" || trackId.length > 100) {
      return NextResponse.json({ error: "Invalid track ID" }, { status: 400 });
    }
    if (!accessToken || typeof accessToken !== "string" || accessToken.length > 100) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Validate user
    const user = await getUserByToken(accessToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    if (user.credits_remaining < 1) {
      return NextResponse.json({ error: "No credits remaining" }, { status: 402 });
    }

    // Download current metadata to verify track exists and is a preview
    const { data: metaFile, error: downloadErr } = await supabaseAdmin.storage
      .from("tracks")
      .download(`${trackId}.json`);

    if (downloadErr || !metaFile) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const metadata = JSON.parse(await metaFile.text());

    if (!metadata.isFreePreview) {
      return NextResponse.json({ error: "Track is already unlocked" }, { status: 400 });
    }

    // Deduct 1 credit
    const deducted = await deductCredit(user.id);
    if (!deducted) {
      return NextResponse.json({ error: "Failed to deduct credit" }, { status: 402 });
    }

    // Update metadata: mark as not a free preview
    metadata.isFreePreview = false;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("tracks")
      .update(`${trackId}.json`, Buffer.from(JSON.stringify(metadata)), {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Metadata update error:", uploadErr);
      // Credit already deducted — still consider it success since the track exists
    }

    // Update generations table
    await supabaseAdmin
      .from("generations")
      .update({ is_free_preview: false, user_id: user.id })
      .eq("track_id", trackId);

    return NextResponse.json({ success: true, credits: user.credits_remaining - 1 });
  } catch (error) {
    console.error("Unlock error:", error);
    return NextResponse.json({ error: "Failed to unlock" }, { status: 500 });
  }
}
