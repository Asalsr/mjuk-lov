import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { OWNER_EMAIL } from "@/lib/owner";
import { bilingualSubject, bilingualHtml } from "@/lib/email/bilingual";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

const STATUSES = ["requested", "confirmed", "delivered", "declined", "done"] as const;
type Status = (typeof STATUSES)[number];

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Mjuk Lov <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) console.error(`order-status: email to ${to} failed`, res.status, await res.text());
  } catch (e) {
    console.error(`order-status: email to ${to} threw`, e);
  }
}

export async function POST(req: Request) {
  // Owner gate: must be the logged-in owner account.
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || user.email !== OWNER_EMAIL) return json({ error: "forbidden" }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const id = String(body.id ?? "").trim();
  const status = String(body.status ?? "").trim() as Status;
  if (!id || !STATUSES.includes(status)) return json({ error: "bad_request" }, 400);

  const quotedPrice =
    body.quotedPrice === null || body.quotedPrice === undefined || body.quotedPrice === ""
      ? null
      : Number(body.quotedPrice);
  if (quotedPrice !== null && (!Number.isFinite(quotedPrice) || quotedPrice < 0))
    return json({ error: "bad_price" }, 400);
  const adminNote = body.adminNote === undefined ? undefined : String(body.adminNote);

  // Service role bypasses RLS; safe because we verified the owner above.
  const db = isAdminConfigured ? createAdminClient() : sb;

  const patch: Record<string, unknown> = { status };
  if (quotedPrice !== null) patch.quoted_price = quotedPrice;
  if (adminNote !== undefined) patch.admin_note = adminNote;
  if (status === "delivered") patch.delivered_at = new Date().toISOString();

  const { data: order, error } = await db
    .from("orders")
    .update(patch)
    .eq("id", id)
    .select("contact_name, contact_email, desired_date, quoted_price, items, order_number")
    .single();
  if (error || !order) {
    console.error("order-status: update failed", error);
    return json({ error: "update_failed" }, 500);
  }

  // Best-effort bilingual (Swedish then English) customer notification.
  const email = (order as { contact_email: string | null }).contact_email;
  if (email) {
    const name = (order as { contact_name: string | null }).contact_name ?? "";
    const price = (order as { quoted_price: number | null }).quoted_price;
    const date = (order as { desired_date: string | null }).desired_date;
    const orderNumber = (order as { order_number: string | null }).order_number ?? id;
    if (status === "confirmed") {
      await sendEmail(
        email,
        `Mjuk Lov — ${bilingualSubject("Din beställning är bekräftad", "Your order is confirmed")}`,
        bilingualHtml(
          `<p>Hej ${name}!</p><p>Din beställning är bekräftad.</p>` +
            (price != null ? `<p>Pris: <b>${price} kr</b></p>` : "") +
            (date ? `<p>Datum: ${date}</p>` : "") +
            `<p>Vi hör av oss med detaljer.</p>`,
          `<p>Hi ${name}!</p><p>Your order is confirmed.</p>` +
            (price != null ? `<p>Price: <b>${price} kr</b></p>` : "") +
            (date ? `<p>Date: ${date}</p>` : "") +
            `<p>We'll be in touch with details.</p>`,
        ),
      );
    } else if (status === "declined") {
      await sendEmail(
        email,
        `Mjuk Lov — ${bilingualSubject("Om din beställning", "About your order")}`,
        bilingualHtml(
          `<p>Hej ${name},</p><p>Tyvärr kan vi inte ta emot den här beställningen just nu. Hör gärna av dig så hittar vi en lösning.</p>`,
          `<p>Hi ${name},</p><p>Unfortunately we can't take this order right now. Do get in touch and we'll find a solution.</p>`,
        ),
      );
    } else if (status === "delivered") {
      const origin = process.env.APP_URL || new URL(req.url).origin;
      const receiptUrl = `${origin}/sv/bestallningar/${orderNumber}/kvitto`;
      await sendEmail(
        email,
        `Mjuk Lov — ${bilingualSubject("Din beställning är levererad", "Your order has been delivered")}`,
        bilingualHtml(
          `<p>Hej ${name}!</p><p>Din beställning är levererad — tack!</p><p>Ditt kvitto: <a href="${receiptUrl}">${receiptUrl}</a></p>`,
          `<p>Hi ${name}!</p><p>Your order has been delivered — thank you!</p><p>Your receipt: <a href="${receiptUrl}">${receiptUrl}</a></p>`,
        ),
      );
    }
  }

  return json({ ok: true });
}
