import { NextRequest, NextResponse } from "next/server";
import { getUserByToken, getUserGenerations } from "@/lib/db";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const ip = getIP(req.headers);
  const { allowed } = rateLimit(`me:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = req.nextUrl.searchParams.get("token");

  if (!token || token.length > 100) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const generations = await getUserGenerations(user.id);

  return NextResponse.json({
    email: user.email,
    credits: user.credits_remaining,
    totalPurchased: user.total_credits_purchased,
    generations: generations.map((g) => ({
      id: g.track_id,
      name: g.name,
      genre: g.genre,
      createdAt: g.created_at,
    })),
  });
}
