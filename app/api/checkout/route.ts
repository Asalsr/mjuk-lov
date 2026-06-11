import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { getProduct } from "@/lib/products";
import { validateOffer } from "@/lib/offers";
import { isLang } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json({ error: "stripe_not_configured" }, 500);

  let body: { productId?: string; lang?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const product = getProduct(String(body.productId ?? ""));
  if (!product) return json({ error: "unknown_product" }, 400);
  const lang = isLang(body.lang ?? "") ? (body.lang as "sv" | "en") : "sv";

  // Orders are owned by a user → require login.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "auth_required" }, 401);

  const fullAmount = product.priceSek * 100; // öre
  let amount = fullAmount;
  let appliedCode: string | null = null;

  // Validate a discount code (if any) server-side and apply it to the price.
  // We only validate here — the redemption is counted when payment succeeds
  // (Stripe webhook), so an abandoned checkout never burns a code.
  const rawCode = typeof body.code === "string" ? body.code.trim() : "";
  if (rawCode && isAdminConfigured) {
    const valid = await validateOffer(createAdminClient(), rawCode, user.id, product);
    if (!valid) return json({ error: "invalid_code" }, 400);
    amount = valid.amount;
    appliedCode = valid.code;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      product_id: product.id,
      product_name: product.name[lang],
      amount,
      currency: "sek",
      status: "pending",
      discount_code: appliedCode,
      original_amount: appliedCode ? fullAmount : null,
    })
    .select("id")
    .single();
  if (error || !order) return json({ error: "order_failed" }, 500);

  const stripe = new Stripe(key);
  const origin = process.env.APP_URL || new URL(req.url).origin;

  // Checkout Session (not Payment Link) so we can price inline without a
  // pre-created Stripe Price, and carry the order id in metadata.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "sek",
          product_data: { name: `Mjuk Lov — ${product.name[lang]} (${product.size})` },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: { foreign_id: order.id }, // webhook matches the order by this
    success_url: `${origin}/${lang}/butik?paid=1`,
    cancel_url: `${origin}/${lang}/butik`,
  });

  await supabase.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
  return json({ url: session.url });
}
