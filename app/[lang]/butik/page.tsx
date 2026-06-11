import { notFound } from "next/navigation";
import { isLang, ui, type Lang } from "@/lib/i18n";
import { KITS, SUBSCRIPTIONS, type Product } from "@/lib/products";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { AddToCartButton } from "@/app/components/shop/AddToCartButton";

export const dynamic = "force-dynamic"; // reads ?paid

function ProductCard({ p, lang }: { p: Product; lang: Lang }) {
  const t = ui[lang];
  return (
    <div
      className="relative p-6 md:p-8 flex flex-col"
      style={{ backgroundColor: "var(--vanilla-cream)", boxShadow: "0 4px 20px rgba(61, 42, 34, 0.05)" }}
    >
      {p.popular && (
        <div className="type-caps italic mb-3" style={{ color: "var(--dusty-wine)" }}>
          — {t.mostPopular} —
        </div>
      )}
      <div className="type-caps ink-muted mb-2">{p.unit ? p.unit[lang] : p.size}</div>
      <h3 className="mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>{p.name[lang]}</h3>
      <p className="type-body opacity-80 mb-4">{p.description[lang]}</p>
      <div className="type-serif mb-6" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)" }}>
        {p.priceSek} kr{p.recurring && <span className="type-caps ink-muted"> {t.perMonth}</span>}
      </div>
      <div className="mt-auto">
        <AddToCartButton productId={p.id} lang={lang} />
      </div>
    </div>
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];
  const { paid } = await searchParams;

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/butik`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--soft-peach)" }}
      >
        <div className="max-w-[1200px] mx-auto" lang={lang}>
          <div className="text-center mb-16 md:mb-20">
            <div className="type-caps ink-muted mb-4">Mjuk&nbsp;Lov</div>
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>{t.shop}</h1>
          </div>

          {paid === "1" && (
            <p className="type-body text-center mb-12" style={{ color: "var(--dusty-terracotta)" }}>
              {t.orderThanks}
            </p>
          )}

          {/* Cake kits */}
          <h2 className="mb-8 md:mb-10" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>{t.kits}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {KITS.map((p) => (
              <ProductCard key={p.id} p={p} lang={lang} />
            ))}
          </div>

          {/* Corporate subscriptions */}
          <h2 className="mt-20 md:mt-28 mb-2" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>{t.subscriptions}</h2>
          <p className="type-body italic ink-muted mb-8 md:mb-10">{t.subscriptionsNote}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {SUBSCRIPTIONS.map((p) => (
              <ProductCard key={p.id} p={p} lang={lang} />
            ))}
          </div>
        </div>
      </section>
    </RecipeShell>
  );
}
