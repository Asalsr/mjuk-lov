import Stripe from "stripe";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whSecret) return new Response("stripe not configured", { status: 500 });

  const stripe = new Stripe(key);
  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text(); // raw body required for signature verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const foreignId = session.metadata?.foreign_id;
    if (foreignId && isAdminConfigured) {
      const admin = createAdminClient();
      // Idempotent: only the initial pending → paid transition is applied.
      // Stripe re-delivers webhooks, so scoping to status="pending" makes a
      // duplicate delivery a no-op and prevents clobbering a later status
      // (e.g. an order already advanced past "paid").
      await admin
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null,
        })
        .eq("id", foreignId)
        .eq("status", "pending");
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
