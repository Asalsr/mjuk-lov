import { OWNER_EMAIL } from "@/lib/owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// Home-page "Get in touch" form → emails the owner (reply-to the sender) via Resend.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const type = String(body.type ?? "").trim();
  const product = String(body.product ?? "").trim();
  if (!name || !email) return json({ error: "contact_required" }, 400);

  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ error: "email_not_configured" }, 500);

  const html =
    `<h2>New enquiry — Mjuk Lov</h2>` +
    `<p><b>${name}</b> — ${email}</p>` +
    `<p>Interested in: ${type || "—"}</p>` +
    `<p>Product / question: ${product || "—"}</p>` +
    `<p>Message:<br>${(message || "—").replace(/\n/g, "<br>")}</p>`;

  // Dedicated contact inbox if set, else the owner email.
  const to = process.env.CONTACT_EMAIL || process.env.contact_email || OWNER_EMAIL;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Mjuk Lov <onboarding@resend.dev>",
        to,
        reply_to: email,
        subject: `Mjuk Lov — enquiry from ${name}`,
        html,
      }),
    });
    if (!res.ok) return json({ error: "send_failed" }, 500);
  } catch {
    return json({ error: "send_failed" }, 500);
  }

  return json({ ok: true });
}
