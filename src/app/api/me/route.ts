import { NextRequest, NextResponse } from "next/server";
import { getUserByToken, getUserGenerations } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
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
