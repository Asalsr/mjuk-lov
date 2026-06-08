"use client";

import { useEffect, useRef } from "react";
import { ui, type Lang } from "@/lib/i18n";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const inputStyle = { border: "1px solid rgba(61, 42, 34, 0.2)" } as const;

export type Address = { street: string; postalCode: string; city: string };

// Load the Maps JS API once (only if a key is present).
let loadPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (typeof window === "undefined" || !KEY) return Promise.reject(new Error("no-key"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps?.places?.PlaceAutocompleteElement) return Promise.resolve();
  if (!loadPromise) {
    // Plain loader (not the inline bootstrap), so `importLibrary` is absent —
    // `libraries=places` puts PlaceAutocompleteElement on google.maps.places
    // directly, which we read once `onload` fires.
    loadPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places&v=weekly`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("maps-failed"));
      document.head.appendChild(s);
    });
  }
  return loadPromise;
}

/** Structured address (street / postcode / city). When a Google Maps key is set,
 *  a search box autocompletes a real address and fills the fields; otherwise the
 *  fields are entered manually. Validates by postcode + city. */
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
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = boxRef.current;
    if (!KEY || !container) return;
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let el: any = null;
    loadMaps()
      .then(() => {
        if (!active) return; // unmounted before the API finished loading
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const places: any = (window as any).google.maps.places;
        el = new places.PlaceAutocompleteElement({ includedRegionCodes: ["se"] });
        el.style.width = "100%";
        container.innerHTML = "";
        container.appendChild(el);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        el.addEventListener("gmp-select", async ({ placePrediction }: any) => {
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ["addressComponents"] });
          const comps = place.addressComponents ?? [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const find = (type: string) => comps.find((c: any) => c.types?.includes(type));
          const num = find("street_number")?.longText ?? "";
          const route = find("route")?.longText ?? "";
          const pc = find("postal_code")?.longText ?? "";
          const town = (find("postal_town") || find("locality") || find("administrative_area_level_2"))?.longText ?? "";
          onChange({ street: `${route} ${num}`.trim(), postalCode: pc, city: town });
        });
      })
      .catch(() => {
        /* no key / load failed → manual fields still work */
      });
    return () => {
      active = false;
      // Remove only the element this effect created (survives Strict Mode's
      // mount→cleanup→mount: the second mount re-inserts a fresh element).
      if (el?.parentNode === container) container.removeChild(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {KEY && (
        <div>
          <label className="type-caps opacity-50" style={{ fontSize: "0.6875rem" }}>{t.addressSearchHint}</label>
          <div ref={boxRef} className="mt-1" />
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
