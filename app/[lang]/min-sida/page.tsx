import { notFound } from "next/navigation";
import Link from "next/link";
import { isLang, ui, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getPublishedRecipes } from "@/lib/recipes";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { MyPageClient } from "@/app/components/auth/MyPageClient";

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

  let favorites: string[] = [];
  let wishlist: string[] = [];
  let notes: { slug: string; body: string }[] = [];
  let history = 0;
  let profile = { fullName: "", address: "" };

  if (user) {
    const [f, w, n, h, p] = await Promise.all([
      supabase.from("favorites").select("slug"),
      supabase.from("wishlist").select("slug"),
      supabase.from("notes").select("slug, body"),
      supabase.from("cooking_history").select("slug"),
      supabase.from("profiles").select("full_name, address").eq("id", user.id).maybeSingle(),
    ]);
    favorites = (f.data ?? []).map((r: { slug: string }) => r.slug);
    wishlist = (w.data ?? []).map((r: { slug: string }) => r.slug);
    notes = (n.data ?? []) as { slug: string; body: string }[];
    history = (h.data ?? []).length;
    const pd = p.data as { full_name: string | null; address: string | null } | null;
    profile = { fullName: pd?.full_name ?? "", address: pd?.address ?? "" };
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
              profile={profile}
              favorites={favorites}
              wishlist={wishlist}
              notes={notes}
              history={history}
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
