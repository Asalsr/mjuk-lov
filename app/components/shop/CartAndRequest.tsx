"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart, setQty, removeFromCart, clearCart } from "@/lib/cart/store";
import { useOrderDate, setOrderDate, clearOrderDate } from "@/lib/cart/orderDate";
import { useUserData } from "@/lib/userdata/store";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProduct } from "@/lib/products";
import { priceLineSek, leadDaysFor, describeLine } from "@/lib/pricing";
import { openingOfferActive, openingOfferPriceSek } from "@/lib/opening-offer";
import { PriceTag } from "./PriceTag";
import { Configurator } from "./Configurator";
import { ui, locNum, type Lang } from "@/lib/i18n";

const inputStyle = { border: "1px solid rgba(61, 42, 34, 0.2)" } as const;

export function CartAndRequest({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const items = useCart();
  const data = useUserData();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // The order-level pickup date is the single source of truth, persisted across
  // navigation/reload (lib/cart/orderDate) rather than re-derived from the cart.
  const date = useOrderDate();
  const [dateCleared, setDateCleared] = useState(false);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false); // ref guard against double-submit (duplicate orders)

  // Configured cart line currently being edited (reopens the configurator).
  const [editing, setEditing] = useState<(typeof items)[number] | null>(null);

  // Prefill from the local profile + the logged-in session (all editable).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time prefill from profile */
    if (data.profile.fullName) setName((n) => n || data.profile.fullName);
    if (data.profile.phone) setPhone((p) => p || data.profile.phone);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (isSupabaseConfigured) {
      createClient()
        .auth.getUser()
        .then(({ data: { user } }) => {
          if (user?.email) setEmail((e) => e || user.email!);
        })
        .catch(() => {});
    }
  }, [data.profile.fullName, data.profile.phone]);

  const lineUnitPrice = (i: (typeof items)[number]) =>
    i.config ? priceLineSek(i.config) : getProduct(i.productId)?.priceSek ?? 0;

  const subtotal = useMemo(
    () =>
      items.reduce(
        (s, i) => s + (i.config ? priceLineSek(i.config) : getProduct(i.productId)?.priceSek ?? 0) * i.qty,
        0,
      ),
    [items],
  );
  // The launch-wide opening offer is automatic while live: every product line is
  // discounted 30%. Summing the per-line discounted prices keeps the cart total
  // equal to what each row shows, and the server recomputes the same discount
  // from the offer's end date.
  const offerLive = openingOfferActive();
  const discountedSubtotal = useMemo(
    () =>
      items.reduce((s, i) => {
        const unit = i.config ? priceLineSek(i.config) : getProduct(i.productId)?.priceSek ?? 0;
        return s + (offerLive ? openingOfferPriceSek(unit) : unit) * i.qty;
      }, 0),
    [items, offerLive],
  );
  const saving = subtotal - discountedSubtotal;
  const total = discountedSubtotal;

  // Earliest selectable date: today + the longest lead time in the cart. A party
  // pack (7 days) raises the floor for the whole order above a kit's 3 days.
  const minDate = useMemo(() => {
    const lead = items.reduce(
      (m, i) => Math.max(m, i.config ? leadDaysFor(i.config) : getProduct(i.productId)?.leadDays ?? 3),
      3,
    );
    const d = new Date();
    d.setDate(d.getDate() + lead);
    return d.toISOString().slice(0, 10);
  }, [items]);

  // Keep the single order-level date in sync with the cart's lead-time floor.
  // Adding a party pack (or removing the only item that justified an earlier
  // date) can push `minDate` past an already-picked date; rather than silently
  // holding an out-of-range value, clear it and prompt the customer to reselect.
  useEffect(() => {
    if (date && date < minDate) {
      clearOrderDate();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- surface the auto-clear as an alert
      setDateCleared(true);
    }
  }, [date, minDate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Guard against double-submit: a fast second click (or Enter) before React
    // re-renders the disabled button would otherwise create a duplicate order.
    if (submitting.current) return;
    if (!name.trim() || (!email.trim() && !phone.trim())) {
      setError(t.contactRequired);
      return;
    }
    if (!date || date < minDate) {
      setError(t.dateTooSoon);
      return;
    }

    submitting.current = true;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/order-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, name, email, phone, desiredDate: date || null, fulfilment: "pickup", notes }),
      });
      const out = await res.json();
      if (out.ok) {
        clearCart();
        clearOrderDate();
        setDone(true);
      } else {
        setError(t.aiError);
      }
    } catch {
      setError(t.aiError);
    } finally {
      setSending(false);
      submitting.current = false;
    }
  };

  if (done) return <p className="type-body" role="status" aria-live="polite">{t.requestSent}</p>;
  if (items.length === 0) return <p className="type-body ink-muted">{t.cartEmpty}</p>;

  return (
    <div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
      <div>
        <ul className="divide-y" style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}>
          {items.map((i) => {
            const p = getProduct(i.productId);
            const label = i.config ? describeLine(i.config, lang) : p?.name[lang] ?? i.productId;
            return (
              <li
                key={i.lineId}
                className="py-4 flex items-center justify-between gap-4"
                style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}
              >
                <div>
                  <div className="type-product" style={{ fontSize: "1.25rem" }}>{label}</div>
                  <div className="type-caps ink-muted">
                    <span className="type-price" style={{ textTransform: "none" }}>
                      <PriceTag sek={lineUnitPrice(i)} lang={lang} compact />
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={i.qty}
                    onChange={(e) => setQty(i.lineId, parseInt(e.target.value) || 1)}
                    aria-label={t.quantity}
                    className="w-16 p-2 type-body bg-transparent"
                    style={inputStyle}
                  />
                  {i.config && (
                    <button
                      type="button"
                      onClick={() => setEditing(i)}
                      className="type-caps ink-muted hover:text-[var(--dusty-terracotta)]"
                    >
                      {t.cartEdit}
                    </button>
                  )}
                  <button type="button" onClick={() => removeFromCart(i.lineId)} className="type-caps ink-muted hover:text-[var(--dusty-terracotta)]">
                    {t.remove}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-col gap-1">
          <div className="flex justify-between type-body ink-muted">
            <span>{t.subtotal}</span>
            <span className="type-price">{locNum(subtotal, lang)} kr</span>
          </div>
          {saving > 0 && (
            <div className="flex justify-between type-body">
              <span>{t.openingOffer}</span>
              <span className="type-price">−{locNum(saving, lang)} kr</span>
            </div>
          )}
          <div className="flex justify-between type-price mt-1" style={{ fontSize: "1.25rem" }}>
            <span>{t.total}</span>
            <span>{locNum(total, lang)} kr <span className="type-caps ink-muted">{t.estimated}</span></span>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="type-caps ink-muted">{t.yourDetails}</div>
        <input required placeholder={t.name} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="p-3 type-body bg-transparent" style={inputStyle} />
        <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" className="p-3 type-body bg-transparent" style={inputStyle} />
        <input type="tel" placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" className="p-3 type-body bg-transparent" style={inputStyle} />

        <label className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{t.desiredDate}</label>
        <input
          type="date"
          required
          min={minDate}
          value={date}
          onChange={(e) => {
            setOrderDate(e.target.value);
            setDateCleared(false);
          }}
          className="p-3 type-body bg-transparent"
          style={inputStyle}
        />
        {dateCleared ? (
          <p className="type-caps" role="alert" aria-live="polite" style={{ fontSize: "0.75rem", color: "var(--dusty-wine)" }}>
            {t.dateReselect}
          </p>
        ) : (
          <p className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{t.leadTimeHint}</p>
        )}

        <textarea placeholder={t.orderNotes} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="p-3 type-body bg-transparent" style={inputStyle} />

        <button type="submit" disabled={sending} className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40" style={{ border: "1px solid var(--warm-cocoa)" }}>
          {sending ? t.sending : t.submitRequest}
        </button>
        {error && <p className="type-body" role="alert" aria-live="assertive" style={{ color: "var(--dusty-wine)" }}>{error}</p>}
      </form>

      {editing && editing.config && (() => {
        const p = getProduct(editing.productId);
        if (!p) return null;
        return (
          <Configurator
            product={p}
            lang={lang}
            initialConfig={editing.config}
            editLineId={editing.lineId}
            onClose={() => setEditing(null)}
          />
        );
      })()}
    </div>
  );
}
