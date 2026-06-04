"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  items: { qty: number; name: string; nameSv: string }[] | null;
};

const STATUSES = ["requested", "confirmed", "declined", "done"] as const;

export function AdminOrders({ lang, orders }: { lang: Lang; orders: Order[] }) {
  const t = ui[lang];
  const router = useRouter();

  const statusLabel = (s: string) =>
    ({ requested: t.statusRequested, confirmed: t.statusConfirmed, declined: t.statusDeclined, done: t.statusDone } as Record<string, string>)[s] ?? s;

  const setStatus = async (id: string, status: string) => {
    await createClient().from("orders").update({ status }).eq("id", id);
    router.refresh();
  };

  if (orders.length === 0) return <p className="type-body opacity-70">{t.nothingYet}</p>;

  return (
    <div className="space-y-6">
      {orders.map((o) => (
        <div key={o.id} className="p-5 md:p-6" style={{ border: "1px solid rgba(61, 42, 34, 0.15)", backgroundColor: "var(--vanilla-cream)" }}>
          <div className="type-serif" style={{ fontSize: "1.25rem" }}>
            {(o.items ?? []).map((it) => `${it.qty}× ${lang === "sv" ? it.nameSv : it.name}`).join(", ") || "—"}
          </div>
          <div className="type-caps opacity-50 mt-1">
            {new Date(o.created_at).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB")}
          </div>

          <div className="type-body mt-3">
            {o.contact_name} — {o.contact_email || ""} {o.contact_phone || ""}
          </div>
          <div className="type-body opacity-80">
            {o.fulfilment === "delivery" ? t.delivery : t.pickup}
            {o.address ? ` · ${o.address}` : ""}
            {o.desired_date ? ` · ${o.desired_date}` : ""}
          </div>
          {o.dietary && <div className="type-body opacity-80">{t.dietaryNeeds}: {o.dietary}</div>}
          {o.notes && <div className="type-body opacity-80 mt-1">“{o.notes}”</div>}

          <div className="mt-4 flex items-center gap-3">
            <select
              value={o.status}
              onChange={(e) => setStatus(o.id, e.target.value)}
              className="p-2 type-caps bg-transparent"
              style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
