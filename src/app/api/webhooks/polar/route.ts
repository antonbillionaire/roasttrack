import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { addCredits } from "@/lib/db";
import { PACKS, PackType } from "@/lib/polar";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = validateEvent(body, headers, process.env.POLAR_WEBHOOK_SECRET!);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.error("Webhook signature invalid");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    throw error;
  }

  try {
    if (event.type === "order.created") {
      const order = event.data;
      const email = order.customer?.email;
      const metadata = order.metadata as Record<string, string> | undefined;
      const packType = (metadata?.packType || "1") as PackType;
      const pack = PACKS[packType] || PACKS["1"];

      if (!email) {
        console.error("No email in order:", order.id);
      } else {
        console.log(`Order ${order.id}: ${email} bought ${pack.label}`);

        await addCredits(
          email,
          pack.credits,
          pack.priceCents,
          order.id,
          packType
        );

        console.log(`Credits added: ${pack.credits} to ${email}`);
      }
    } else {
      console.log(`Unhandled webhook event: ${event.type}`);
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 500 so Polar retries the webhook (credits not lost)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
