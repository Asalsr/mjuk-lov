"use client";

import { useUserData, logCooked, cookedCount } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";

export function MadeItButton({ slug, lang }: { slug: string; lang: Lang }) {
  const data = useUserData();
  const t = ui[lang];
  const count = cookedCount(data, slug);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => logCooked(slug, new Date().toISOString())}
        className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)]"
        style={{ border: "1px solid var(--warm-cocoa)" }}
      >
        {t.madeIt}
      </button>
      {count > 0 && <span className="type-caps opacity-60">{t.madeCount(count)}</span>}
    </div>
  );
}
