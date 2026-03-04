import { NextRequest, NextResponse } from "next/server";
import { polar } from "@/lib/polar";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const ip = getIP(req.headers);
  const { allowed } = rateLimit(`activate:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const checkoutId = req.nextUrl.searchParams.get("checkout_id");

  if (!checkoutId || checkoutId.length > 100) {
    return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
  }

  try {
    // Fetch checkout details from Polar to get customer email
    const checkout = await polar.checkouts.get({ id: checkoutId });
    const email = checkout.customerEmail;

    if (!email) {
      return NextResponse.json(
        { error: "No email found for this checkout" },
        { status: 404 }
      );
    }

    // Find user in Supabase by email
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("access_token, credits_remaining")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!user) {
      // Webhook might not have processed yet — tell client to retry
      return NextResponse.json(
        { error: "Credits not ready yet", retry: true },
        { status: 202 }
      );
    }

    return NextResponse.json({
      token: user.access_token,
      credits: user.credits_remaining,
    });
  } catch (error) {
    console.error("Activate error:", error);
    return NextResponse.json(
      { error: "Failed to activate" },
      { status: 500 }
    );
  }
}
