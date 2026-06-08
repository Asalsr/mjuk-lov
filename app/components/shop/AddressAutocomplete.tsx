"use client";

import { useEffect, useRef, useState } from "react";
import { ui, type Lang } from "@/lib/i18n";

const inputStyle = { border: "1px solid rgba(61, 42, 34, 0.2)" } as const;

export type Address = { street: string; postalCode: string; city: string };
type Suggestion = { placeId: string; main: string; secondary: string };

/** Structured address (street / postcode / city). A search box autocompletes a
 *  real address via our own /api/places proxy — the Google key stays server-side
 *  and never reaches the browser. Degrades to manual fields if the proxy isn't
 *  configured. */
export function AddressAutocomplete({
  value,
  onChange,
  lang,
}: {
  value: Address;
  onChange: (a: Address) => void;
  lang: Lang;
}) {
  const t = ui[lang];
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(true); // hidden if proxy returns not_configured
  const sessionRef = useRef<string>("");
  const boxRef = useRef<HTMLDivElement>(null);

  const newSession = () =>
    (sessionRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));

  // Debounced autocomplete lookup against our proxy.
  useEffect(() => {
    if (!searchEnabled) return;
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    if (!sessionRef.current) newSession();
    const id = setTimeout(async () => {
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: q, sessionToken: sessionRef.current }),
        });
        // 503 = no server key; 502 = Google rejected (API disabled / billing off).
        // Either way autocomplete can't work, so hide the box → clean manual fields.
        if (res.status === 503 || res.status === 502) {
          setSearchEnabled(false);
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        /* network hiccup → manual fields still work */
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query, searchEnabled]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const select = async (s: Suggestion) => {
    setOpen(false);
    setQuery(s.secondary ? `${s.main}, ${s.secondary}` : s.main);
    try {
      const res = await fetch(`/api/places/details?id=${encodeURIComponent(s.placeId)}&session=${encodeURIComponent(sessionRef.current)}`);
      newSession(); // a details call ends the billing session
      if (!res.ok) return;
      const data = (await res.json()) as { address?: Address };
      if (data.address) onChange(data.address);
    } catch {
      /* leave manual fields for the user */
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {searchEnabled && (
        <div className="relative" ref={boxRef}>
          <label className="type-caps opacity-50" style={{ fontSize: "0.6875rem" }}>{t.addressSearchHint}</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length && setOpen(true)}
            placeholder={t.addressSearchHint}
            autoComplete="off"
            className="mt-1 p-3 type-body bg-transparent w-full"
            style={inputStyle}
          />
          {open && suggestions.length > 0 && (
            <ul
              className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-auto"
              style={{ backgroundColor: "var(--vanilla-cream)", border: "1px solid rgba(61, 42, 34, 0.2)", boxShadow: "0 8px 24px rgba(61,42,34,0.12)" }}
            >
              {suggestions.map((s) => (
                <li key={s.placeId}>
                  <button
                    type="button"
                    // onMouseDown beats the input's blur so the click registers
                    onMouseDown={(e) => { e.preventDefault(); select(s); }}
                    className="w-full text-left px-3 py-2 type-body transition-colors hover:bg-[var(--soft-peach)]"
                  >
                    <span>{s.main}</span>
                    {s.secondary && <span className="opacity-50"> · {s.secondary}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <input
        placeholder={t.street}
        value={value.street}
        onChange={(e) => onChange({ ...value, street: e.target.value })}
        className="p-3 type-body bg-transparent"
        style={inputStyle}
      />
      <div className="flex gap-3">
        <input
          placeholder={t.postalCode}
          value={value.postalCode}
          onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
          className="p-3 type-body bg-transparent w-1/3"
          style={inputStyle}
        />
        <input
          placeholder={t.city}
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          className="p-3 type-body bg-transparent flex-1"
          style={inputStyle}
        />
      </div>
    </div>
  );
}
