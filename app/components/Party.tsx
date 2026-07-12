import { ui, type Lang } from "@/lib/i18n";
import { PARTY_PACK } from "@/lib/products";
import { MakeItYoursButton } from "@/app/components/shop/MakeItYoursButton";
import { DiyParty } from "@/app/components/Icons";

/** The Party Pack, sold by occasion — shown wherever the kits are presented
 *  (homepage kit section, /kit landing, shop). A first-class block, not a quiet
 *  card: the occasions are named and the CTA opens the same calm configurator.
 *
 *  `illustrated` opts into the side illustration that fills the empty space
 *  beside the copy — used on the home page only. */
export function Party({ lang, illustrated = false }: { lang: Lang; illustrated?: boolean }) {
  const t = ui[lang];
  return (
    <div
      className={`px-6 py-[clamp(2.5rem,6vw,4.5rem)] md:px-12${
        illustrated ? " flex flex-col md:flex-row md:items-center gap-8 md:gap-12" : ""
      }`}
      style={{ backgroundColor: "var(--vanilla-cream)", boxShadow: "0 4px 20px rgba(61, 42, 34, 0.05)" }}
      lang={lang}
    >
      <div className={`max-w-[46rem]${illustrated ? " md:flex-1" : ""}`}>
        <div className="type-caps ink-muted mb-3">{t.partyEyebrow}</div>
        <h3 className="type-product mb-5" style={{ fontSize: "clamp(1.75rem, 4vw, 2.6rem)" }}>
          {t.partyBlockHeading}
        </h3>
        <p className="type-body mb-5">{t.partyBlockBody}</p>
        <p className="type-caps ink-muted mb-6">{t.partyBlockMeta}</p>
        <MakeItYoursButton product={PARTY_PACK} lang={lang} label={t.partyBlockCta} variant="link" />
      </div>
      {/* Home page only: fills the empty space beside the copy on wider screens. */}
      {illustrated && (
        <div className="hidden md:flex md:flex-1 items-center justify-center">
          <DiyParty className="w-full max-w-[24rem] h-auto" alt={t.partyIllustrationAlt} />
        </div>
      )}
    </div>
  );
}
