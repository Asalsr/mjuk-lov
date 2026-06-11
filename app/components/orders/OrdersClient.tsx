"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ui, locNum, type Lang } from "@/lib/i18n";

// A customer's order, covering BOTH flows: request-to-order (items + quoted_price)
// and kit checkout (product_name + amount in öre). Built by the server page.
export type OrderView = {
  id: string;
  order_number: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
  desired_date: string | null;
  fulfilment: string | null;
  address: string | null;
  quoted_price: number | null; // request, SEK
  amount: number | null; // kit, öre
  product_name: string | null; // kit
  items: { qty: number; name: string; nameSv: string; priceSek?: number | null }[] | null;
};

// Orders-page-specific chrome. Status labels come from ui[lang] (already i18n'd);
// these are the filter/heading strings, kept local to avoid churn on the
// frequently-edited lib/i18n.ts. Migrate into i18n later if desired.
const T = {
  sv: { filterStatus: "Status", all: "Alla", period: "Period", thisMonth: "Denna månad", lastMonth: "Förra månaden", thisYear: "I år", custom: "Anpassad", from: "Från", to: "Till", none: "Inga beställningar matchar.", view: "Visa" },
  en: { filterStatus: "Status", all: "All", period: "Period", thisMonth: "This month", lastMonth: "Last month", thisYear: "This year", custom: "Custom", from: "From", to: "To", none: "No orders match.", view: "View" },
  fa: { filterStatus: "وضعیت", all: "همه", period: "بازه", thisMonth: "این ماه", lastMonth: "ماه گذشته", thisYear: "امسال", custom: "سفارشی", from: "از", to: "تا", none: "سفارشی مطابقت ندارد.", view: "مشاهده" },
} as const;

const STATUS_FILTERS = ["all", "requested", "confirmed", "delivered", "declined"] as const;
const DATE_PRESETS = ["all", "thisMonth", "lastMonth", "thisYear", "custom"] as const;
type DatePreset = (typeof DATE_PRESETS)[number];

const statusColor = (s: string) =>
  ({ requested: "var(--dusty-terracotta)", confirmed: "var(--warm-cocoa)", paid: "var(--warm-cocoa)", delivered: "var(--dusty-wine)", done: "var(--dusty-wine)", declined: "#6e5a50" } as Record<string, string>)[s] ??
  "var(--warm-cocoa)";

/** Order total in SEK: kit amount (öre→kr), else owner quote, else summed item estimate. */
function orderTotalSek(o: OrderView): number | null {
  if (o.amount != null) return Math.round(o.amount / 100);
  if (o.quoted_price != null) return o.quoted_price;
  const est = (o.items ?? []).reduce((s, i) => s + (i.priceSek ?? 0) * i.qty, 0);
  return est > 0 ? est : null;
}

function orderSummary(o: OrderView, lang: Lang): string {
  if (o.items && o.items.length) return o.items.map((i) => `${i.qty}× ${lang === "sv" ? i.nameSv : i.name}`).join(", ");
  return o.product_name ?? "—";
}

/** Inclusive [start, end) bounds for a preset, or null = unbounded. */
function presetRange(preset: DatePreset, fromStr: string, toStr: string): { start: number | null; end: number | null } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (preset === "thisMonth") return { start: new Date(y, m, 1).getTime(), end: new Date(y, m + 1, 1).getTime() };
  if (preset === "lastMonth") return { start: new Date(y, m - 1, 1).getTime(), end: new Date(y, m, 1).getTime() };
  if (preset === "thisYear") return { start: new Date(y, 0, 1).getTime(), end: new Date(y + 1, 0, 1).getTime() };
  if (preset === "custom") {
    return {
      start: fromStr ? new Date(fromStr).getTime() : null,
      end: toStr ? new Date(toStr).getTime() + 86_400_000 : null, // include the whole "to" day
    };
  }
  return { start: null, end: null };
}

const chip = (active: boolean) =>
  ({
    fontSize: "0.75rem",
    padding: "0.2rem 0.6rem",
    border: active ? "1px solid var(--warm-cocoa)" : "1px solid rgba(61, 42, 34, 0.2)",
    backgroundColor: active ? "var(--warm-peach)" : "transparent",
    fontWeight: active ? 600 : undefined,
  }) as const;

export function OrdersClient({ orders, lang }: { orders: OrderView[]; lang: Lang }) {
  const t = ui[lang];
  const tt = T[lang];
  const [status, setStatus] = useState<string>("all");
  const [preset, setPreset] = useState<DatePreset>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const statusLabel = (s: string) =>
    s === "all"
      ? tt.all
      : ({ requested: t.statusRequested, confirmed: t.statusConfirmed, paid: t.statusConfirmed, delivered: t.statusDelivered, done: t.statusDelivered, declined: t.statusDeclined } as Record<string, string>)[s] ?? s;

  const shown = useMemo(() => {
    const { start, end } = presetRange(preset, from, to);
    return orders.filter((o) => {
      if (status !== "all") {
        const norm = o.status === "paid" ? "confirmed" : o.status === "done" ? "delivered" : o.status;
        if (norm !== status) return false;
      }
      const ts = new Date(o.created_at).getTime();
      if (start != null && ts < start) return false;
      if (end != null && ts >= end) return false;
      return true;
    });
  }, [orders, status, preset, from, to]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{tt.filterStatus}</span>
          {STATUS_FILTERS.map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)} aria-pressed={status === s} className="type-caps tap" style={chip(status === s)}>
              {statusLabel(s)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{tt.period}</span>
          {DATE_PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setPreset(p)} aria-pressed={preset === p} className="type-caps tap" style={chip(preset === p)}>
              {p === "all" ? tt.all : tt[p]}
            </button>
          ))}
          {preset === "custom" && (
            <span className="flex items-center gap-2">
              <label className="type-caps ink-muted" style={{ fontSize: "0.7rem" }}>
                {tt.from} <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="type-body bg-transparent ml-1" style={{ border: "1px solid rgba(61,42,34,0.2)", padding: "0.1rem 0.3rem" }} />
              </label>
              <label className="type-caps ink-muted" style={{ fontSize: "0.7rem" }}>
                {tt.to} <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="type-body bg-transparent ml-1" style={{ border: "1px solid rgba(61,42,34,0.2)", padding: "0.1rem 0.3rem" }} />
              </label>
            </span>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="type-body ink-muted">{tt.none}</p>
      ) : (
        <ul className="divide-y" style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}>
          {shown.map((o) => {
            const total = orderTotalSek(o);
            const ref = o.order_number ?? o.id.slice(0, 8);
            return (
              <li key={o.id} style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}>
                <Link href={`/${lang}/bestallningar/${o.order_number ?? o.id}`} className="flex items-start justify-between gap-4 py-4 transition-colors hover:text-[var(--dusty-terracotta)]">
                  <span className="flex flex-col gap-1">
                    <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>
                      {ref} · {new Date(o.created_at).toLocaleDateString(lang === "sv" ? "sv-SE" : lang === "fa" ? "fa-IR" : "en-GB")}
                    </span>
                    <span className="type-body">{orderSummary(o, lang)}</span>
                    {total != null && (
                      <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{locNum(total, lang)} kr</span>
                    )}
                  </span>
                  <span
                    className="type-caps shrink-0"
                    style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", color: "var(--vanilla-cream)", backgroundColor: statusColor(o.status) }}
                  >
                    {statusLabel(o.status === "paid" ? "confirmed" : o.status)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
