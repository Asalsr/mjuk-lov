"use client";

import { useRef } from "react";
import { exportAll, importAll } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";

/** Export/import the device-local data — a backup against a cleared browser,
 *  and the migration path into an account in Phase 2. */
export function DataControls({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mjuklov-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importAll(String(reader.result));
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <></>
    // <div className="flex items-center justify-center gap-6 mt-10">
    //   <button
    //     type="button"
    //     onClick={onExport}
    //     className="type-caps opacity-60 transition-colors hover:opacity-100 hover:text-[var(--dusty-terracotta)]"
    //   >
    //     {t.exportData}
    //   </button>
    //   <button
    //     type="button"
    //     onClick={() => fileRef.current?.click()}
    //     className="type-caps opacity-60 transition-colors hover:opacity-100 hover:text-[var(--dusty-terracotta)]"
    //   >
    //     {t.importData}
    //   </button>
    //   <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
    // </div>
  );
}
