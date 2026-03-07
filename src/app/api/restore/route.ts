import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Strict rate limit: 3 attempts per 5 minutes per IP (prevents email enumeration)
  const ip = getIP(req.headers);
  const { allowed } = rateLimit(`restore:${ip}`, 3, 300_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@") || email.length > 200) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "No account found with this email. Buy credits first!" }, { status: 404 });
    }

    return NextResponse.json({
      token: user.access_token,
      credits: user.credits_remaining,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
