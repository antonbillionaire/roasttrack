import { NextRequest, NextResponse } from "next/server";
import { polar, PACKS, PackType } from "@/lib/polar";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 checkout attempts per minute per IP
  const ip = getIP(req.headers);
  const { allowed } = rateLimit(`checkout:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { packType } = await req.json();

    if (!packType || !PACKS[packType as PackType]) {
      return NextResponse.json({ error: "Invalid pack type" }, { status: 400 });
    }

    const pack = PACKS[packType as PackType];

    const checkout = await polar.checkouts.create({
      products: [pack.polarProductId],
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?checkout_id={CHECKOUT_ID}`,
      metadata: {
        packType,
        credits: String(pack.credits),
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
