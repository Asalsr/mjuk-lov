import { notFound } from "next/navigation";
import { isLang, ui, locNum, type Lang } from "@/lib/i18n";
import { KITS, CAKES, MENU, PARTY_PACK, SUBSCRIPTIONS, type Product } from "@/lib/products";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { AddToCartButton } from "@/app/components/shop/AddToCartButton";
import { MakeItYoursButton } from "@/app/components/shop/MakeItYoursButton";
import { MenuLineCard } from "@/app/components/shop/MenuLineCard";
import { PhotoDisclaimer } from "@/app/components/PhotoDisclaimer";
import { Party } from "@/app/components/Party";

export const dynamic = "force-dynamic"; // reads ?paid

function ProductCard({ p, lang, comingSoon }: { p: Product; lang: Lang; comingSoon?: boolean }) {
  const t = ui[lang];
  const fromLabel = p.kind === "party";
  const isCake = p.kind === "cake"; // ready-made: we decorate, shorter flow
  return (
    <div
      className="relative p-6 md:p-8 flex flex-col"
      style={{ backgroundColor: "var(--vanilla-cream)", boxShadow: "0 4px 20px rgba(61, 42, 34, 0.05)" }}
    >
      <div className="type-caps ink-muted mb-2">{p.unit ? p.unit[lang] : p.size}</div>
      <h3 className="type-product mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>{p.name[lang]}</h3>
      {comingSoon ? (
        // Pre-launch: no price, no buy button — a solid-token "Coming soon" pill.
        <>
          <p className="type-body ink-muted mb-4">{p.description[lang]}</p>
          <div className="mt-auto">
            <span
              className="type-caps inline-block px-4 py-1.5"
              style={{ border: "1px solid var(--warm-cocoa)", color: "var(--warm-cocoa)" }}
            >
              {t.comingSoon}
            </span>
          </div>
        </>
      ) : p.configurable ? (
        // Promise, don't expose: just price + one "Make it yours" button, with a
        // quiet line naming what's ahead. No options on the card.
        <>
          <div className="type-price mb-6" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)" }}>
            {fromLabel && <span className="type-caps ink-muted">{t.kitFrom} </span>}
            {locNum(p.priceSek, lang)} kr
          </div>
          <div className="mt-auto">
            <MakeItYoursButton product={p} lang={lang} label={isCake ? t.chooseCake : undefined} />
            <p className="type-caps ink-muted mt-3">
              {isCake ? t.cakeCardPromise : fromLabel ? t.partyPromise : t.cardPromise}
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="type-body ink-muted mb-4">{p.description[lang]}</p>
          <div className="type-price mb-6" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)" }}>
            {locNum(p.priceSek, lang)} kr{p.recurring && <span className="type-caps ink-muted"> {t.perMonth}</span>}
          </div>
          <div className="mt-auto">
            <AddToCartButton productId={p.id} lang={lang} />
          </div>
        </>
      )}
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
        <div className="max-w-[1320px] mx-auto" lang={lang}>
          <div className="text-center mb-16 md:mb-20">
            <div className="type-caps ink-muted mb-4">Mjuk&nbsp;Lov</div>
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>{t.shop}</h1>
          </div>

          {paid === "1" && (
            <p className="type-body text-center mb-12" style={{ color: "var(--dusty-terracotta)" }}>
              {t.orderThanks}
            </p>
          )}

          {/* Ready-made cakes — same three sizes, baked and decorated by us */}
          <h2 className="mb-2" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>{t.cakesHeading}</h2>
          <p className="type-body italic ink-muted mb-8 md:mb-10">{t.cakesTagline}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {CAKES.map((p) => (
              <ProductCard key={p.id} p={p} lang={lang} />
            ))}
          </div>

          {/* Party Pack — sold by occasion, with its own configurable card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-20 md:mt-28">
            <div className="md:col-span-2">
              <Party lang={lang} />
            </div>
            <ProductCard p={PARTY_PACK} lang={lang} />
          </div>

          {/* Cake kits — the DIY signature; sits after the Party invitation */}
          <h2 className="mt-20 md:mt-28 mb-8 md:mb-10" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>{t.kits}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {KITS.map((p) => (
              <ProductCard key={p.id} p={p} lang={lang} />
            ))}
          </div>

          {/* Cakes & bakes (menu line) */}
          <h2 id="bakes" className="mt-20 md:mt-28 mb-2 scroll-mt-28" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>{t.menuHeading}</h2>
          <p className="type-body italic ink-muted mb-8 md:mb-10">{t.menuTagline}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {MENU.map((p) => (
              <MenuLineCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
          {/* One illustrative-photo notice for the whole menu gallery (§2a) */}
          <PhotoDisclaimer lang={lang} className="mt-6" />

          {/* Corporate subscriptions */}
          <h2 className="mt-20 md:mt-28 mb-2" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>{t.subscriptions}</h2>
          <p className="type-body italic ink-muted mb-8 md:mb-10">{t.subscriptionsNote}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {SUBSCRIPTIONS.map((p) => (
              <ProductCard key={p.id} p={p} lang={lang} comingSoon />
            ))}
          </div>
        </div>
      </section>
    </RecipeShell>
  );
}
