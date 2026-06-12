import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isLang, ui, locNum, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Single-language labels for this page (kept inline to avoid churn on i18n.ts).
const L = {
  sv: { back: "← Mina beställningar", item: "Vara", qty: "Antal", total: "Totalt", ordered: "Beställd", delivered: "Levererad", date: "Datum", receipt: "Ladda ner kvitto", delivery: "Leverans", pickup: "Upphämtning" },
  en: { back: "← My orders", item: "Item", qty: "Qty", total: "Total", ordered: "Ordered", delivered: "Delivered", date: "Date", receipt: "Download receipt", delivery: "Delivery", pickup: "Pickup" },
  fa: { back: "← سفارش‌های من", item: "کالا", qty: "تعداد", total: "مجموع", ordered: "ثبت‌شده", delivered: "تحویل‌شده", date: "تاریخ", receipt: "دانلود رسید", delivery: "ارسال", pickup: "تحویل حضوری" },
} as const;

type Order = {
  id: string;
  order_number: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
  desired_date: string | null;
  fulfilment: string | null;
  address: string | null;
  quoted_price: number | null;
  amount: number | null;
  product_name: string | null;
  items: { qty: number; name: string; nameSv: string; priceSek?: number | null }[] | null;
};

export default async function Page({ params }: { params: Promise<{ lang: string; orderNumber: string }> }) {
  const { lang: raw, orderNumber } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];
  const l = L[lang];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/logga-in`);

  const cols =
    "id, order_number, status, created_at, delivered_at, desired_date, fulfilment, address, quoted_price, amount, product_name, items";
  const query = supabase.from("orders").select(cols);
  // Links use order_number; pre-migration links may carry the uuid id.
  const { data: order } = await (UUID.test(orderNumber)
    ? query.eq("id", orderNumber)
    : query.eq("order_number", orderNumber)
  ).maybeSingle<Order>();
  if (!order) notFound(); // RLS-scoped, so a non-owner simply gets nothing → 404

  const statusLabel =
    ({ requested: t.statusRequested, confirmed: t.statusConfirmed, paid: t.statusConfirmed, delivered: t.statusDelivered, done: t.statusDelivered, declined: t.statusDeclined } as Record<string, string>)[order.status] ??
    order.status;
  const totalSek =
    order.amount != null ? Math.round(order.amount / 100) : order.quoted_price ?? null;
  const fmt = (d: string) => new Date(d).toLocaleDateString(lang === "sv" ? "sv-SE" : lang === "fa" ? "fa-IR" : "en-GB");
  const lines = order.items ?? [];

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/bestallningar/${orderNumber}`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--vanilla-cream)" }}
      >
        <div className="max-w-[640px] mx-auto" lang={lang}>
          <Link href={`/${lang}/bestallningar`} className="type-caps ink-muted transition-colors hover:text-[var(--dusty-terracotta)]">
            {l.back}
          </Link>

          <div className="mt-6 flex items-start justify-between gap-4">
            {/* The heading is an order code, not prose — render it in the Inter
                caps face so it matches how order numbers appear in the list and
                receipt, rather than the serif display face used for title words. */}
            <h1 className="type-caps" style={{ fontSize: "clamp(1.375rem, 3vw, 1.875rem)", letterSpacing: "0.08em" }}>{order.order_number ?? order.id.slice(0, 8)}</h1>
            <span
              className="type-caps shrink-0 mt-2"
              style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", color: "var(--vanilla-cream)", backgroundColor: order.status === "declined" ? "#6e5a50" : "var(--warm-cocoa)" }}
            >
              {statusLabel}
            </span>
          </div>

          <dl className="mt-6 type-body" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.35rem 1.5rem" }}>
            <dt className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{l.ordered}</dt>
            <dd>{fmt(order.created_at)}</dd>
            {order.fulfilment && (
              <>
                <dt className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>
                  {order.fulfilment === "delivery" ? l.delivery : l.pickup}
                </dt>
                <dd>{order.address || (order.desired_date ? fmt(order.desired_date) : "—")}</dd>
              </>
            )}
            {order.delivered_at && (
              <>
                <dt className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{l.delivered}</dt>
                <dd>{fmt(order.delivered_at)}</dd>
              </>
            )}
          </dl>

          {lines.length > 0 && (
            <ul className="divide-y mt-8" style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}>
              {lines.map((i, idx) => (
                <li key={idx} className="flex items-baseline justify-between gap-4 py-2.5" style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}>
                  <span className="type-body">{i.qty}× {lang === "sv" ? i.nameSv : i.name}</span>
                  {i.priceSek != null && <span className="type-caps ink-muted">{locNum(i.priceSek * i.qty, lang)} kr</span>}
                </li>
              ))}
            </ul>
          )}
          {lines.length === 0 && order.product_name && (
            <p className="type-body mt-8">{order.product_name}</p>
          )}

          {totalSek != null && (
            <div className="flex justify-between type-serif mt-4" style={{ fontSize: "1.25rem" }}>
              <span>{l.total}</span>
              <span>{locNum(totalSek, lang)} kr</span>
            </div>
          )}

          {(order.status === "delivered" || order.status === "done") && (
            <div className="mt-10">
              <Link
                href={`/${lang}/bestallningar/${order.order_number ?? order.id}/kvitto`}
                className="type-caps tap inline-flex px-6 py-3 transition-all hover:bg-[var(--warm-peach)]"
                style={{ border: "1px solid var(--warm-cocoa)" }}
              >
                {l.receipt}
              </Link>
            </div>
          )}
        </div>
      </section>
    </RecipeShell>
  );
}
