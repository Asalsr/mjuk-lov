import { notFound, redirect } from "next/navigation";
import { isLang, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { DELIVERY_FEE_SEK } from "@/lib/products";
import { SELLER } from "@/lib/seller";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { Receipt, type ReceiptData } from "@/app/components/shop/Receipt";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  order_number: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
  fulfilment: string | null;
  address: string | null;
  quoted_price: number | null;
  amount: number | null;
  product_name: string | null;
  items: { qty: number; name: string; nameSv: string; priceSek?: number | null }[] | null;
  contact_name: string | null;
};

export default async function Page({ params }: { params: Promise<{ lang: string; orderNumber: string }> }) {
  const { lang: raw, orderNumber } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/logga-in`);

  const cols =
    "id, order_number, status, created_at, delivered_at, fulfilment, address, quoted_price, amount, product_name, items, contact_name";
  const q = supabase.from("orders").select(cols);
  const { data: o } = await (UUID.test(orderNumber)
    ? q.eq("id", orderNumber)
    : q.eq("order_number", orderNumber)
  ).maybeSingle<Row>();
  if (!o) notFound(); // RLS-scoped → non-owner gets nothing

  // A receipt only exists once the order is fulfilled.
  if (o.status !== "delivered" && o.status !== "done") redirect(`/${lang}/bestallningar/${orderNumber}`);

  const isKit = o.amount != null;
  const lines = isKit
    ? [{ name: o.product_name ?? "–", qty: 1, lineTotalSek: Math.round((o.amount ?? 0) / 100) }]
    : (o.items ?? []).map((i) => ({
        name: lang === "sv" ? i.nameSv : i.name,
        qty: i.qty,
        lineTotalSek: (i.priceSek ?? 0) * i.qty,
      }));
  const subtotalSek = lines.reduce((s, l) => s + l.lineTotalSek, 0);
  const deliveryFeeSek = !isKit && o.fulfilment === "delivery" ? DELIVERY_FEE_SEK : 0;
  // The owner's quote is the agreed amount for request orders; kit total is the charged amount.
  const totalSek = isKit ? Math.round((o.amount ?? 0) / 100) : o.quoted_price ?? subtotalSek + deliveryFeeSek;

  const data: ReceiptData = {
    orderNumber: o.order_number ?? o.id.slice(0, 8),
    dateLabel: new Date(o.delivered_at ?? o.created_at).toLocaleDateString(
      lang === "sv" ? "sv-SE" : lang === "fa" ? "fa-IR" : "en-GB",
    ),
    customerName: o.contact_name ?? user.email ?? "",
    fulfilment: o.fulfilment === "delivery" || o.fulfilment === "pickup" ? o.fulfilment : null,
    address: o.address,
    lines,
    subtotalSek,
    deliveryFeeSek,
    totalSek,
    paid: isKit,
  };

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/bestallningar/${orderNumber}/kvitto`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--vanilla-cream)" }}
      >
        <Receipt data={data} seller={SELLER} lang={lang} />
      </section>
    </RecipeShell>
  );
}
