import { notFound } from "next/navigation";
import { isLang, ui, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { OWNER_EMAIL } from "@/lib/owner";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { AdminOrders } from "@/app/components/admin/AdminOrders";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Owner-only. Non-owners (or guests) get a 404.
  if (!user || user.email !== OWNER_EMAIL) notFound();

  // Read every order with the service role (bypasses RLS) so the owner reliably
  // sees guest and all users' requests — independent of the per-row RLS owner
  // policy / which email it hardcodes. Safe: we've already verified the owner above.
  const db = isAdminConfigured ? createAdminClient() : supabase;
  const { data } = await db
    .from("orders")
    .select(
      "id, status, created_at, desired_date, fulfilment, address, dietary, notes, contact_name, contact_email, contact_phone, items, quoted_price, admin_note",
    )
    .order("created_at", { ascending: false });

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/admin`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--vanilla-cream)" }}
      >
        <div className="max-w-[820px] mx-auto" lang={lang}>
          <h1 className="mb-10" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>{t.manageOrders}</h1>
          <AdminOrders lang={lang} orders={data ?? []} />
        </div>
      </section>
    </RecipeShell>
  );
}
