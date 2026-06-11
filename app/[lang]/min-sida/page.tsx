import { notFound } from "next/navigation";
import Link from "next/link";
import { isLang, ui, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { ensurePersonalOffer, type Offer } from "@/lib/offers";
import { OWNER_EMAIL } from "@/lib/owner";
import { getPublishedRecipes } from "@/lib/recipes";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { MyPageClient } from "@/app/components/auth/MyPageClient";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  desired_date: string | null;
  fulfilment: string | null;
  quoted_price: number | null;
  items: { qty: number; name: string; nameSv: string }[] | null;
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favorites: string[] = [];
  let wishlist: string[] = [];
  let notes: { slug: string; body: string }[] = [];
  let made: string[] = [];
  let profile = { fullName: "", phone: "", address: "" };
  let orders: OrderRow[] = [];
  let memoryConsent = false;
  let memoryCount = 0;
  let marketingConsent = false;
  let offers: Offer[] = [];

  if (user) {
    const [f, w, n, h, p, o, c, m] = await Promise.all([
      supabase.from("favorites").select("slug"),
      supabase.from("wishlist").select("slug"),
      supabase.from("notes").select("slug, body"),
      supabase.from("cooking_history").select("slug"),
      supabase.from("profiles").select("full_name, phone, address").eq("id", user.id).maybeSingle(),
      supabase.from("orders").select("id, status, created_at, desired_date, fulfilment, quoted_price, items").order("created_at", { ascending: false }),
      supabase.from("consents").select("kind, granted").eq("user_id", user.id),
      supabase.from("ai_messages").select("id", { count: "exact", head: true }),
    ]);
    favorites = (f.data ?? []).map((r: { slug: string }) => r.slug);
    wishlist = (w.data ?? []).map((r: { slug: string }) => r.slug);
    notes = (n.data ?? []) as { slug: string; body: string }[];
    made = Array.from(new Set((h.data ?? []).map((r: { slug: string }) => r.slug)));
    const pd = p.data as { full_name: string | null; phone: string | null; address: string | null } | null;
    profile = { fullName: pd?.full_name ?? "", phone: pd?.phone ?? "", address: pd?.address ?? "" };
    orders = (o.data ?? []) as OrderRow[];
    const consents = (c.data ?? []) as { kind: string; granted: boolean }[];
    memoryConsent = consents.some((r) => r.kind === "ai_memory" && r.granted);
    marketingConsent = consents.some((r) => r.kind === "marketing" && r.granted);
    memoryCount = m.count ?? 0;

    // Personalized offers are opt-in (marketing consent) and minted server-side.
    if (marketingConsent && isAdminConfigured) {
      offers = await ensurePersonalOffer(createAdminClient(), user.id, {
        orders: orders.length,
        favorites: favorites.length,
        history: made.length,
      });
    }
  }

  const titles: Record<string, string> = Object.fromEntries(
    getPublishedRecipes().map((r) => [r.slug, r.title[lang]]),
  );

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/min-sida`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--vanilla-cream)" }}
      >
        <div className="max-w-[720px] mx-auto" lang={lang}>
          <h1 className="mb-8" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>{t.myPage}</h1>
          {user ? (
            <MyPageClient
              lang={lang}
              email={user.email ?? ""}
              userId={user.id}
              profile={profile}
              favorites={favorites}
              wishlist={wishlist}
              notes={notes}
              made={made}
              orders={orders}
              memoryConsent={memoryConsent}
              memoryCount={memoryCount}
              marketingConsent={marketingConsent}
              offers={offers}
              isOwner={user.email === OWNER_EMAIL}
              titles={titles}
            />
          ) : (
            <p className="type-body">
              {t.notLoggedIn}{" "}
              <Link href={`/${lang}/logga-in`} className="underline hover:text-[var(--dusty-terracotta)]">
                {t.logIn}
              </Link>
            </p>
          )}
        </div>
      </section>
    </RecipeShell>
  );
}
