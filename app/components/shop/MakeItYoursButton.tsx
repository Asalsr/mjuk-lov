"use client";

import { useState } from "react";
import { ui, isRtl, type Lang } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { Configurator } from "./Configurator";

/** The single call-to-action on a configurable shop card. Opens the
 *  step-by-step configurator; the card itself exposes no options. The `link`
 *  variant is used inside the Party section, where the CTA reads as a link. */
export function MakeItYoursButton({
  product,
  lang,
  label,
  variant = "solid",
}: {
  product: Product;
  lang: Lang;
  label?: string;
  variant?: "solid" | "link";
}) {
  const [open, setOpen] = useState(false);
  const t = ui[lang];
  const arrow = isRtl(lang) ? "←" : "→";

  const className =
    variant === "link"
      ? "type-caps inline-flex items-center gap-2 transition-colors hover:text-[var(--dusty-terracotta)]"
      : "type-caps w-full px-6 py-3 transition-all hover:bg-[var(--warm-peach)]";
  const style = variant === "link" ? undefined : { border: "1px solid var(--warm-cocoa)" };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} style={style}>
        {label ?? t.makeItYours} <span aria-hidden="true">{arrow}</span>
      </button>
      {open && <Configurator product={product} lang={lang} onClose={() => setOpen(false)} />}
    </>
  );
}
