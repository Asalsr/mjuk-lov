import { createClient } from "@/lib/supabase/server";

// GDPR Art. 15 (access) + Art. 20 (portability): hand the signed-in user a
// machine-readable copy of everything we hold for them. Reads go through the
// RLS-scoped server client, so a user can only ever export their own rows.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [profile, favorites, wishlist, notes, history, orders, addresses, consents, aiMessages, aiSummary] =
    await Promise.all([
      db.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      db.from("favorites").select("*"),
      db.from("wishlist").select("*"),
      db.from("notes").select("*"),
      db.from("cooking_history").select("*"),
      db.from("orders").select("*"),
      db.from("delivery_addresses").select("*"),
      db.from("consents").select("kind, granted, version, updated_at"),
      db.from("ai_messages").select("role, content, created_at").order("created_at", { ascending: true }),
      db.from("ai_summary").select("summary, updated_at").maybeSingle(),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email ?? null },
    profile: profile.data ?? null,
    favorites: favorites.data ?? [],
    wishlist: wishlist.data ?? [],
    notes: notes.data ?? [],
    cookingHistory: history.data ?? [],
    orders: orders.data ?? [],
    deliveryAddresses: addresses.data ?? [],
    consents: consents.data ?? [],
    aiMessages: aiMessages.data ?? [],
    aiSummary: aiSummary.data ?? null,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mjuk-lov-data.json"`,
    },
  });
}
