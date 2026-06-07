import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { getProduct, DELIVERY_FEE_SEK } from "@/lib/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

const OWNER_EMAIL = process.env.OWNER_EMAIL || "mjuklov.se@gmail.com";

// Earliest acceptable desired date: today + 3 days (UTC), as YYYY-MM-DD.
function minDesiredDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 3);
  return d.toISOString().slice(0, 10);
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Mjuk Lov <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
  } catch {
    /* email is best-effort; the request is already saved */
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const rawItems = Array.isArray(body.items) ? (body.items as { productId: string; qty: number; message?: string }[]) : [];
  if (rawItems.length === 0) return json({ error: "empty_cart" }, 400);

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  if (!name || (!email && !phone)) return json({ error: "contact_required" }, 400);

  const desiredDate = String(body.desiredDate ?? "").trim();
  if (!desiredDate || desiredDate < minDesiredDate()) return json({ error: "date_too_soon" }, 400);

  const items = rawItems.map((i) => {
    const p = getProduct(i.productId);
    return {
      productId: i.productId,
      name: p?.name.en ?? i.productId,
      nameSv: p?.name.sv ?? i.productId,
      qty: Number(i.qty) || 1,
      priceSek: p?.priceSek ?? null,
      message: i.message ?? "",
    };
  });

  // Attach the account if logged in.
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id ?? null;

  // Guests need the service-role client; logged-in users can insert via RLS.
  const admin = isAdminConfigured ? createAdminClient() : null;
  const db = admin ?? (userId ? sb : null);
  if (!db) return json({ error: "not_configured" }, 500);

  const fulfilment = body.fulfilment === "delivery" ? "delivery" : "pickup";
  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: userId,
      items,
      contact_name: name,
      contact_email: email || null,
      contact_phone: phone || null,
      desired_date: desiredDate,
      fulfilment,
      address: fulfilment === "delivery" ? (body.address as string) || null : null,
      dietary: (body.dietary as string) || null,
      notes: (body.notes as string) || null,
      status: "requested",
      currency: "sek",
    })
    .select("id")
    .single();
  if (error || !order) return json({ error: "save_failed" }, 500);

  // Notify (best-effort).
  const lines = items
    .map((li) => `${li.qty}× ${li.name}${li.priceSek ? ` (${li.priceSek} kr)` : ""}${li.message ? ` — “${li.message}”` : ""}`)
    .join("<br>");
  const subtotal = items.reduce((s, li) => s + (li.priceSek ?? 0) * li.qty, 0);
  const deliveryFee = fulfilment === "delivery" ? DELIVERY_FEE_SEK : 0;
  const total = subtotal + deliveryFee;
  const summary =
    `<h2>New order request</h2>` +
    `<p><b>${name}</b> — ${email} ${phone}</p>` +
    `<p>${lines}</p>` +
    `<p>Subtotal: ${subtotal} kr${deliveryFee ? ` · Delivery: ${deliveryFee} kr` : ""} · <b>Total (est.): ${total} kr</b></p>` +
    `<p>Date: ${desiredDate} · ${fulfilment}${body.address ? ` · ${body.address}` : ""}</p>` +
    `<p>Dietary: ${(body.dietary as string) || "—"}</p>` +
    `<p>Notes: ${(body.notes as string) || "—"}</p>` +
    `<p>Ref: ${order.id}</p>`;
  await sendEmail(OWNER_EMAIL, `Mjuk Lov — order request from ${name}`, summary);
  if (email)
    await sendEmail(
      email,
      "Mjuk Lov — we received your request",
      `<p>Tack ${name}! We received your request and will get back to you within 24 hours with confirmation and price.</p>${summary}`,
    );

  return json({ ok: true, id: order.id });
}
