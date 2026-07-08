import { ui, type Lang } from "@/lib/i18n";

/**
 * Illustrative-photo notice for product photography.
 *
 * House rule: every product **photo group** carries this once. Cakes are baked
 * to the size (cm) and weight (kg) ordered, so the height, number of layers and
 * finish of a real order can differ from the example shown in a photo, e.g. a
 * three-layer birthday cake in the picture versus a smaller two-layer 15 cm
 * order. Place it under the photo (or gallery), not on every thumbnail.
 *
 * Copy lives in `lib/i18n.ts` (`photoDisclaimer`, all locales). Uses `.ink-muted`
 * (never opacity on text) and RTL-safe alignment; renders as a `<figcaption>`
 * when wrapped in a `<figure>`, otherwise a paragraph.
 */
export function PhotoDisclaimer({
  lang,
  as: Tag = "p",
  className = "",
}: {
  lang: Lang;
  as?: "p" | "figcaption";
  className?: string;
}) {
  return (
    <Tag className={`type-body ink-muted ${className}`} style={{ fontSize: "0.875rem" }}>
      {ui[lang].photoDisclaimer}
    </Tag>
  );
}
