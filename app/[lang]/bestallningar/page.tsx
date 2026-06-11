import { notFound, redirect } from "next/navigation";
import { isLang, ui, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { OrdersClient, type OrderView } from "@/app/components/orders/OrdersClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/logga-in`);

  // RLS scopes this to the signed-in user's own orders.
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, created_at, delivered_at, desired_date, fulfilment, address, quoted_price, amount, product_name, items",
    )
    .order("created_at", { ascending: false });

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/bestallningar`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--vanilla-cream)" }}
      >
        <div className="max-w-[820px] mx-auto" lang={lang}>
          <h1 className="mb-10" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>{t.orders}</h1>
          <OrdersClient orders={(data ?? []) as OrderView[]} lang={lang} />
        </div>
      </section>
    </RecipeShell>
  );
}
