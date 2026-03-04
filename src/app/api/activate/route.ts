import { NextRequest, NextResponse } from "next/server";
import { polar } from "@/lib/polar";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const checkoutId = req.nextUrl.searchParams.get("checkout_id");

  if (!checkoutId) {
    return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
  }

  try {
    // Fetch checkout details from Polar to get customer email
    const checkout = await polar.checkouts.get(checkoutId);
    const email = checkout.customer?.email || checkout.customerEmail;

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
