"use client";

import { useUserData, saveNote } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";

export function NoteEditor({ slug, lang }: { slug: string; lang: Lang }) {
  const data = useUserData();
  const t = ui[lang];

  return (
    <div>
      <div className="type-caps ink-muted mb-3">{t.yourNote}</div>
      <textarea
        value={data.notes[slug] ?? ""}
        onChange={(e) => saveNote(slug, e.target.value)}
        placeholder={t.notePlaceholder}
        rows={3}
        className="w-full p-4 type-body bg-transparent"
        style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}
      />
      <p className="type-caps ink-muted mt-2" style={{ fontSize: "0.75rem" }}>
        {t.savedOnDevice}
      </p>
    </div>
  );
}
