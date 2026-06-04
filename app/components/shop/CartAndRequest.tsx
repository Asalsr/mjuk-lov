"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart, setQty, removeFromCart, clearCart } from "@/lib/cart/store";
import { useUserData } from "@/lib/userdata/store";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProduct } from "@/lib/products";
import { LABELS } from "@/lib/allergen/labels";
import { ui, type Lang } from "@/lib/i18n";

const inputStyle = { border: "1px solid rgba(61, 42, 34, 0.2)" } as const;

export function CartAndRequest({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const items = useCart();
  const data = useUserData();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [dietary, setDietary] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the local profile + the logged-in session (all editable).
  useEffect(() => {
    if (data.profile.fullName) setName((n) => n || data.profile.fullName);
    if (data.profile.address) setAddress((a) => a || data.profile.address);
    if (data.profile.allergies.length)
      setDietary((d) => d || data.profile.allergies.map((c) => LABELS[c][lang]).join(", "));
    if (isSupabaseConfigured) {
      createClient()
        .auth.getUser()
        .then(({ data: { user } }) => {
          if (user?.email) setEmail((e) => e || user.email!);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.profile.fullName, data.profile.address]);

  const total = useMemo(
    () => items.reduce((s, i) => s + (getProduct(i.productId)?.priceSek ?? 0) * i.qty, 0),
    [items],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim())) {
      setError(t.contactRequired);
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/order-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, name, email, phone, desiredDate: date || null, fulfilment, address, dietary, notes }),
      });
      const out = await res.json();
      if (out.ok) {
        clearCart();
        setDone(true);
      } else {
        setError(t.aiError);
      }
    } catch {
      setError(t.aiError);
    } finally {
      setSending(false);
    }
  };

  if (done) return <p className="type-body">{t.requestSent}</p>;
  if (items.length === 0) return <p className="type-body opacity-70">{t.cartEmpty}</p>;

  return (
    <div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
      <div>
        <ul className="divide-y" style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}>
          {items.map((i) => {
            const p = getProduct(i.productId);
            return (
              <li
                key={i.productId}
                className="py-4 flex items-center justify-between gap-4"
                style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}
              >
                <div>
                  <div className="type-serif" style={{ fontSize: "1.25rem" }}>{p?.name[lang] ?? i.productId}</div>
                  <div className="type-caps opacity-50">{p?.priceSek} kr</div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={i.qty}
                    onChange={(e) => setQty(i.productId, parseInt(e.target.value) || 1)}
                    aria-label={t.quantity}
                    className="w-16 p-2 type-body bg-transparent"
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => removeFromCart(i.productId)} className="type-caps opacity-50 hover:text-[var(--dusty-terracotta)]">
                    {t.remove}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="type-serif mt-4" style={{ fontSize: "1.25rem" }}>
          {total} kr <span className="type-caps opacity-50">(est.)</span>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="type-caps opacity-60">{t.yourDetails}</div>
        <input required placeholder={t.name} value={name} onChange={(e) => setName(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
        <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
        <input placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />

        <label className="type-caps opacity-50" style={{ fontSize: "0.6875rem" }}>{t.desiredDate}</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
        <p className="type-caps opacity-40" style={{ fontSize: "0.625rem" }}>{t.leadTimeHint}</p>

        <div className="flex gap-6 type-body">
          <label className="flex items-center gap-2">
            <input type="radio" name="ful" checked={fulfilment === "pickup"} onChange={() => setFulfilment("pickup")} />
            {t.pickup}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="ful" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} />
            {t.delivery}
          </label>
        </div>
        {fulfilment === "delivery" && (
          <input placeholder={t.deliveryAddress} value={address} onChange={(e) => setAddress(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
        )}

        <input placeholder={t.dietaryNeeds} value={dietary} onChange={(e) => setDietary(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
        <textarea placeholder={t.orderNotes} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="p-3 type-body bg-transparent" style={inputStyle} />

        <button type="submit" disabled={sending} className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40" style={{ border: "1px solid var(--warm-cocoa)" }}>
          {sending ? t.sending : t.submitRequest}
        </button>
        {error && <p className="type-body" style={{ color: "var(--dusty-wine)" }}>{error}</p>}
      </form>
    </div>
  );
}
