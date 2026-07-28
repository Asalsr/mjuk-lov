import { locNum, ui, type Lang } from "@/lib/i18n";
import { openingOfferActive, openingOfferPriceSek } from "@/lib/opening-offer";

/** How a single price renders while the launch opening offer is live: the
 *  original struck through (with a red line, so it reads as "not the price any
 *  more"), the 30%-off price beside it, and a small offer badge so the saving is
 *  named, not just implied. Once the offer ends it renders the plain price and
 *  nothing else, so the same component is safe to leave in place everywhere.
 *
 *  Pure and prop-driven (no hooks), so it drops into both server-rendered pages
 *  and client components. Callers keep their own wrapper (the `type-price` box
 *  and its font-size); this only fills in the number(s). `prefix`/`suffix` carry
 *  adornments like the "from" label or a "/month" suffix. `compact` drops the
 *  block badge for tight rows (e.g. a cart line) where the strike + price alone
 *  already signal the offer. */
export function PriceTag({
  sek,
  lang,
  prefix,
  suffix,
  compact = false,
}: {
  sek: number;
  lang: Lang;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  compact?: boolean;
}) {
  const t = ui[lang];
  if (!openingOfferActive()) {
    return (
      <>
        {prefix}
        {locNum(sek, lang)} kr
        {suffix}
      </>
    );
  }
  const now = openingOfferPriceSek(sek);
  return (
    <>
      {prefix}
      {/* The red strike is decoration; the sr-only label carries the meaning to
          screen readers so the two prices aren't just two bare numbers. */}
      <s className="ink-muted" style={{ textDecorationColor: "var(--dusty-wine)" }}>
        <span className="sr-only">{t.regularPrice}: </span>
        {locNum(sek, lang)} kr
      </s>{" "}
      <span>
        {locNum(now, lang)} kr
      </span>
      {suffix}
      {!compact && (
        <span className="type-caps ink-muted block mt-1" style={{ fontSize: "0.75rem" }}>
          {t.openingOffer}
        </span>
      )}
    </>
  );
}
