"use client";

import { useUserData, toggleMade, isMade } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";
import { IconAction } from "./IconAction";

export function MadeItButton({ slug, lang }: { slug: string; lang: Lang }) {
  const data = useUserData();
  const t = ui[lang];
  const made = isMade(data, slug);

  return (
    <IconAction
      icon={made ? "✓" : "○"}
      label={made ? t.madeDone : t.madeIt}
      ariaLabel={made ? t.madeDone : t.madeIt}
      active={made}
      onClick={() => toggleMade(slug)}
    />
  );
}
