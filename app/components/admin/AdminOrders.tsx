"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ui, type Lang } from "@/lib/i18n";

type Order = {
  id: string;
  status: string;
  created_at: string;
  desired_date: string | null;
  fulfilment: string | null;
  address: string | null;
  dietary: string | null;
  notes: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  items: { qty: number; name: string; nameSv: string; priceSek?: number | null }[] | null;
  quoted_price: number | null;
  admin_note: string | null;
  order_number: string | null;
  delivered_at: string | null;
  product_name: string | null;
};

const TABS = ["requested", "confirmed", "delivered", "declined", "all"] as const;
type Tab = (typeof TABS)[number];

const STATUS_COLOR: Record<string, string> = {
  requested: "var(--dusty-terracotta)",
  confirmed: "var(--warm-cocoa)",
  done: "var(--dusty-wine)",
  delivered: "var(--dusty-wine)",
  declined: "#6e5a50",
};

export function AdminOrders({ lang, orders }: { lang: Lang; orders: Order[] }) {
  const t = ui[lang];
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("requested");
  const [busy, setBusy] = useState<string | null>(null);
  // Local draft of the price/note inputs, keyed by order id.
  const [draft, setDraft] = useState<Record<string, { price: string; note: string }>>({});
  const [datePreset, setDatePreset] = useState<"all" | "thisMonth" | "lastMonth" | "thisYear" | "custom">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const statusLabel = (s: string) =>
    ({ requested: t.statusRequested, confirmed: t.statusConfirmed, declined: t.statusDeclined, done: t.statusDone, delivered: t.statusDelivered } as Record<string, string>)[s] ?? s;

  const draftFor = (o: Order) =>
    draft[o.id] ?? { price: o.quoted_price != null ? String(o.quoted_price) : "", note: o.admin_note ?? "" };

  const update = async (id: string, status: string, extra?: { quotedPrice?: string; adminNote?: string }) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          quotedPrice: extra?.quotedPrice ?? undefined,
          adminNote: extra?.adminNote ?? undefined,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const counts = TABS.reduce((acc, tb) => {
    acc[tb] = tb === "all" ? orders.length : orders.filter((o) => o.status === tb).length;
    return acc;
  }, {} as Record<Tab, number>);

  const tabLabel = (tb: Tab) =>
    tb === "all" ? t.allOrders : tb === "requested" ? t.newRequests : statusLabel(tb);

  const dateRange: readonly [number | null, number | null] = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    if (datePreset === "thisMonth") return [new Date(y, m, 1).getTime(), new Date(y, m + 1, 1).getTime()];
    if (datePreset === "lastMonth") return [new Date(y, m - 1, 1).getTime(), new Date(y, m, 1).getTime()];
    if (datePreset === "thisYear") return [new Date(y, 0, 1).getTime(), new Date(y + 1, 0, 1).getTime()];
    if (datePreset === "custom")
      return [dateFrom ? new Date(dateFrom).getTime() : null, dateTo ? new Date(dateTo).getTime() + 86_400_000 : null];
    return [null, null];
  })();
  const shown = orders.filter((o) => {
    if (tab !== "all" && o.status !== tab) return false;
    const ts = new Date(o.created_at).getTime();
    if (dateRange[0] != null && ts < dateRange[0]) return false;
    if (dateRange[1] != null && ts >= dateRange[1]) return false;
    return true;
  });
  const DATE_PRESETS = ["all", "thisMonth", "lastMonth", "thisYear", "custom"] as const;
  const DATE_L =
    lang === "sv"
      ? { period: "Period", all: "Alla", thisMonth: "Denna månad", lastMonth: "Förra månaden", thisYear: "I år", custom: "Anpassad", from: "Från", to: "Till" }
      : lang === "fa"
        ? { period: "بازه", all: "همه", thisMonth: "این ماه", lastMonth: "ماه گذشته", thisYear: "امسال", custom: "سفارشی", from: "از", to: "تا" }
        : { period: "Period", all: "All", thisMonth: "This month", lastMonth: "Last month", thisYear: "This year", custom: "Custom", from: "From", to: "To" };

  const mailtoFor = (o: Order) => {
    const items = (o.items ?? []).map((it) => `${it.qty}× ${lang === "sv" ? it.nameSv : it.name}`).join(", ");
    const subject = `Mjuk Lov: ${t.orderRef} ${(o.order_number ?? o.id.slice(0, 8))}`;
    const body = `${o.contact_name ?? ""}\n${items}${o.desired_date ? `\n${o.desired_date}` : ""}`;
    return `mailto:${o.contact_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className="type-caps px-3 py-2 transition-colors"
            style={{
              border: "1px solid rgba(61, 42, 34, 0.2)",
              backgroundColor: tab === tb ? "var(--warm-peach)" : "transparent",
            }}
          >
            {tabLabel(tb)} ({counts[tb]})
          </button>
        ))}
      </div>

      {/* Date-range filter */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{DATE_L.period}</span>
        {DATE_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setDatePreset(p)}
            className="type-caps px-3 py-1"
            style={{ fontSize: "0.75rem", border: "1px solid rgba(61,42,34,0.2)", backgroundColor: datePreset === p ? "var(--warm-peach)" : "transparent" }}
          >
            {DATE_L[p]}
          </button>
        ))}
        {datePreset === "custom" && (
          <span className="flex items-center gap-2">
            <label className="type-caps ink-muted" style={{ fontSize: "0.7rem" }}>
              {DATE_L.from} <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="type-body bg-transparent ml-1" style={{ border: "1px solid rgba(61,42,34,0.2)", padding: "0.1rem 0.3rem" }} />
            </label>
            <label className="type-caps ink-muted" style={{ fontSize: "0.7rem" }}>
              {DATE_L.to} <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="type-body bg-transparent ml-1" style={{ border: "1px solid rgba(61,42,34,0.2)", padding: "0.1rem 0.3rem" }} />
            </label>
          </span>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="type-body ink-muted">{t.nothingYet}</p>
      ) : (
        <div className="space-y-6">
          {shown.map((o) => {
            const d = draftFor(o);
            const setD = (patch: Partial<{ price: string; note: string }>) =>
              setDraft((prev) => ({ ...prev, [o.id]: { ...d, ...patch } }));
            const est = (o.items ?? []).reduce((s, it) => s + (it.priceSek ?? 0) * it.qty, 0);
            return (
              <div key={o.id} className="p-5 md:p-6" style={{ border: "1px solid rgba(61, 42, 34, 0.15)", backgroundColor: "var(--vanilla-cream)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="type-serif" style={{ fontSize: "1.25rem" }}>
                    {(o.items ?? []).map((it) => `${it.qty}× ${lang === "sv" ? it.nameSv : it.name}`).join(", ") || o.product_name || "–"}
                  </div>
                  <span
                    className="type-caps shrink-0"
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem", color: "var(--vanilla-cream)", backgroundColor: STATUS_COLOR[o.status] ?? "var(--warm-cocoa)" }}
                  >
                    {statusLabel(o.status)}
                  </span>
                </div>

                <div className="type-caps ink-muted mt-1">
                  {new Date(o.created_at).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB")} · {t.orderRef} {(o.order_number ?? o.id.slice(0, 8))}
                </div>

                <div className="type-body mt-3 break-words">
                  {o.contact_name}, {o.contact_email || ""} {o.contact_phone || ""}
                </div>
                <div className="type-body opacity-80 break-words">
                  {o.fulfilment === "delivery" ? t.delivery : t.pickup}
                  {o.address ? ` · ${o.address}` : ""}
                  {o.desired_date ? ` · ${o.desired_date}` : ""}
                  {est ? <> · {t.estTotal}: <span className="type-price">{est} kr</span></> : ""}
                </div>
                {o.dietary && <div className="type-body opacity-80">{t.dietaryNeeds}: {o.dietary}</div>}
                {o.notes && <div className="type-body opacity-80 mt-1">“{o.notes}”</div>}
                {o.quoted_price != null && (
                  <div className="type-body mt-1"><b>{t.confirmedPrice}: <span className="type-price">{o.quoted_price} kr</span></b></div>
                )}

                {/* Contact */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {o.contact_email && (
                    <a href={mailtoFor(o)} className="type-caps px-3 py-2 transition-colors hover:bg-[var(--warm-peach)]" style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}>
                      {t.emailCustomer}
                    </a>
                  )}
                  {o.contact_phone && (
                    <a href={`tel:${o.contact_phone}`} className="type-caps px-3 py-2 transition-colors hover:bg-[var(--warm-peach)]" style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}>
                      {t.callCustomer}
                    </a>
                  )}
                </div>

                {/* Price + internal note */}
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 type-caps ink-muted">
                    {t.priceQuote}
                    <input
                      type="number"
                      min={0}
                      value={d.price}
                      onChange={(e) => setD({ price: e.target.value })}
                      className="p-2 bg-transparent type-body"
                      style={{ border: "1px solid rgba(61, 42, 34, 0.2)", width: 120 }}
                    />
                  </label>
                  <label className="flex flex-col gap-1 type-caps ink-muted flex-1" style={{ minWidth: 200 }}>
                    {t.adminNote}
                    <input
                      type="text"
                      value={d.note}
                      onChange={(e) => setD({ note: e.target.value })}
                      className="p-2 bg-transparent type-body"
                      style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}
                    />
                  </label>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {o.status === "requested" && (
                    <>
                      <button disabled={busy === o.id} onClick={() => update(o.id, "confirmed", { quotedPrice: d.price, adminNote: d.note })} className="type-caps px-4 py-2 transition-colors hover:opacity-80" style={{ backgroundColor: "var(--warm-cocoa)", color: "var(--vanilla-cream)" }}>
                        {t.accept}
                      </button>
                      <button disabled={busy === o.id} onClick={() => update(o.id, "declined", { adminNote: d.note })} className="type-caps px-4 py-2 transition-colors hover:bg-[var(--warm-peach)]" style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}>
                        {t.decline}
                      </button>
                    </>
                  )}
                  {o.status === "confirmed" && (
                    <>
                      <button disabled={busy === o.id} onClick={() => update(o.id, "delivered", { quotedPrice: d.price, adminNote: d.note })} className="type-caps px-4 py-2 transition-colors hover:opacity-80" style={{ backgroundColor: "var(--dusty-wine)", color: "var(--vanilla-cream)" }}>
                        {t.markDelivered}
                      </button>
                      <button disabled={busy === o.id} onClick={() => update(o.id, "requested", { quotedPrice: d.price, adminNote: d.note })} className="type-caps px-4 py-2 transition-colors hover:bg-[var(--warm-peach)]" style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}>
                        {t.reopen}
                      </button>
                    </>
                  )}
                  {o.status === "paid" && (
                    <button disabled={busy === o.id} onClick={() => update(o.id, "delivered", { adminNote: d.note })} className="type-caps px-4 py-2 transition-colors hover:opacity-80" style={{ backgroundColor: "var(--dusty-wine)", color: "var(--vanilla-cream)" }}>
                      {t.markDelivered}
                    </button>
                  )}
                  {(o.status === "declined" || o.status === "delivered" || o.status === "done") && (
                    <button disabled={busy === o.id} onClick={() => update(o.id, "requested", { adminNote: d.note })} className="type-caps px-4 py-2 transition-colors hover:bg-[var(--warm-peach)]" style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}>
                      {t.reopen}
                    </button>
                  )}
                  {/* Save price/note without changing status (only meaningful once confirmed). */}
                  {o.status === "confirmed" && (
                    <button disabled={busy === o.id} onClick={() => update(o.id, "confirmed", { quotedPrice: d.price, adminNote: d.note })} className="type-caps px-4 py-2 transition-colors hover:bg-[var(--warm-peach)]" style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}>
                      {t.saveNote}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
