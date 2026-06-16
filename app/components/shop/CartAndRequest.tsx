"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCart, setQty, removeFromCart, clearCart } from "@/lib/cart/store";
import { useUserData } from "@/lib/userdata/store";
import { useAddresses, addAddress, deleteAddress, setDefaultAddress } from "@/lib/addresses/store";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DELIVERY_FEE_SEK } from "@/lib/products";
import { priceLineSek, describeLine, earliestDateFor } from "@/lib/pricing";
import { LABELS } from "@/lib/allergen/labels";
import { AddressAutocomplete, type Address } from "./AddressAutocomplete";
import { ui, locNum, type Lang } from "@/lib/i18n";

const NEW = "new"; // sentinel for the "add a new address" choice
const fmtAddr = (street: string, pc: string, city: string) =>
  [street, [pc, city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
const addrSummary = (a: { street: string; postalCode: string; city: string }) => fmtAddr(a.street, a.postalCode, a.city);

const inputStyle = { border: "1px solid rgba(61, 42, 34, 0.2)" } as const;

export function CartAndRequest({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const items = useCart();
  const data = useUserData();

  const { addresses, loading: addrLoading, refresh: refreshAddresses } = useAddresses();
  const [loggedIn, setLoggedIn] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">("pickup");
  const [dietary, setDietary] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false); // ref guard against double-submit (duplicate orders)

  // Address selection: a saved address id, or NEW to enter a fresh one.
  const [selectedAddrId, setSelectedAddrId] = useState<string>(NEW);
  const [addr, setAddr] = useState<Address>({ street: "", postalCode: "", city: "" });
  const [addrLabel, setAddrLabel] = useState("");
  const [recvName, setRecvName] = useState("");
  const [recvPhone, setRecvPhone] = useState("");

  // Prefill from the local profile + the logged-in session (all editable).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time prefill from profile */
    if (data.profile.fullName) setName((n) => n || data.profile.fullName);
    if (data.profile.phone) setPhone((p) => p || data.profile.phone);
    if (data.profile.allergies.length)
      setDietary((d) => d || data.profile.allergies.map((c) => LABELS[c][lang]).join(", "));
    /* eslint-enable react-hooks/set-state-in-effect */
    if (isSupabaseConfigured) {
      createClient()
        .auth.getUser()
        .then(({ data: { user } }) => {
          setLoggedIn(!!user);
          if (user?.email) setEmail((e) => e || user.email!);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.profile.fullName, data.profile.phone]);

  // Once addresses load, default the selection to the user's default (else the
  // most recent; the list is already ordered default-first, newest-first).
  useEffect(() => {
    if (addrLoading || addresses.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- default the picker once the list arrives
    setSelectedAddrId((cur) => (cur === NEW ? addresses[0].id : cur));
  }, [addrLoading, addresses]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + priceLineSek(i.config), 0),
    [items],
  );
  const deliveryFee = fulfilment === "delivery" ? DELIVERY_FEE_SEK : 0;
  const total = subtotal + deliveryFee;

  // Earliest selectable date: max lead-day across the cart (party = 7, big menu = 4,
  // kits = 3, small menu = 2). Empty cart falls back to a kit-equivalent +3.
  const minDate = useMemo(
    () => (items.length ? earliestDateFor(items.map((i) => i.config)) : (() => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 3);
      return d.toISOString().slice(0, 10);
    })()),
    [items],
  );

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

    // Resolve the delivery address + receiver, and stage a save for new ones.
    let address = "";
    let receiverName = "";
    let receiverPhone = "";
    let saveNew: Parameters<typeof addAddress>[0] | null = null;
    if (fulfilment === "delivery") {
      const chosen = loggedIn && selectedAddrId !== NEW ? addresses.find((a) => a.id === selectedAddrId) : null;
      if (chosen) {
        address = fmtAddr(chosen.street, chosen.postalCode, chosen.city);
        receiverName = chosen.receiverName || name;
        receiverPhone = chosen.receiverPhone || phone;
      } else {
        if (!addr.street.trim()) {
          setError(t.addressRequired);
          return;
        }
        address = fmtAddr(addr.street, addr.postalCode, addr.city);
        receiverName = recvName.trim() || name;
        receiverPhone = recvPhone.trim() || phone;
        if (loggedIn) {
          if (!addrLabel.trim()) {
            setError(t.labelRequired);
            return;
          }
          saveNew = {
            label: addrLabel.trim(),
            street: addr.street,
            postalCode: addr.postalCode,
            city: addr.city,
            receiverName: recvName.trim(),
            receiverPhone: recvPhone.trim(),
          };
        }
      }
    }

    submitting.current = true;
    setSending(true);
    setError(null);
    try {
      if (saveNew) {
        await addAddress(saveNew);
        void refreshAddresses();
      }
      const res = await fetch("/api/order-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ lineId: i.lineId, config: i.config, message: i.message })),
          name, email, phone, desiredDate: date || null, fulfilment, address, receiverName, receiverPhone, dietary, notes,
        }),
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
            const linePrice = priceLineSek(i.config);
            return (
              <li
                key={i.lineId}
                className="py-4 flex items-center justify-between gap-4"
                style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}
              >
                <div>
                  <div className="type-serif" style={{ fontSize: "1.25rem" }}>{describeLine(i.config, lang)}</div>
                  <div className="type-caps ink-muted">{locNum(linePrice, lang)} kr</div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={i.config.qty}
                    onChange={(e) => setQty(i.lineId, parseInt(e.target.value) || 1)}
                    aria-label={t.quantity}
                    className="w-16 p-2 type-body bg-transparent"
                    style={inputStyle}
                  />
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
            <span>{locNum(subtotal, lang)} kr</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between type-body ink-muted">
              <span>{t.deliveryFee}</span>
              <span>{locNum(deliveryFee, lang)} kr</span>
            </div>
          )}
          <div className="flex justify-between type-serif mt-1" style={{ fontSize: "1.25rem" }}>
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
        <input type="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
        <p className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{t.leadTimeHint}</p>

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
          <div className="flex flex-col gap-3">
            {loggedIn && addresses.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{t.savedAddresses}</div>
                {addresses.map((a) => (
                  <label key={a.id} className="flex items-start gap-2 p-3 cursor-pointer" style={inputStyle}>
                    <input type="radio" name="addr" checked={selectedAddrId === a.id} onChange={() => setSelectedAddrId(a.id)} className="mt-1" />
                    <span className="flex-1">
                      <span className="type-body flex items-center gap-2">
                        {a.label}
                        {a.isDefault && (
                          <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>· {t.defaultBadge}</span>
                        )}
                      </span>
                      <span className="type-caps ink-muted block" style={{ fontSize: "0.75rem" }}>{addrSummary(a)}</span>
                      {(a.receiverName || a.receiverPhone) && (
                        <span className="type-caps ink-muted block" style={{ fontSize: "0.75rem" }}>
                          {[a.receiverName, a.receiverPhone].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      <span className="flex gap-3 mt-1">
                        {!a.isDefault && (
                          <button type="button" onClick={async () => { await setDefaultAddress(a.id); void refreshAddresses(); }} className="type-caps ink-muted hover:text-[var(--dusty-terracotta)]" style={{ fontSize: "0.75rem" }}>
                            {t.setDefault}
                          </button>
                        )}
                        <button type="button" onClick={async () => { if (!window.confirm(t.confirmDeleteAddress)) return; await deleteAddress(a.id); setSelectedAddrId((cur) => (cur === a.id ? NEW : cur)); void refreshAddresses(); }} className="type-caps ink-muted hover:text-[var(--dusty-terracotta)]" style={{ fontSize: "0.75rem" }}>
                          {t.remove}
                        </button>
                      </span>
                    </span>
                  </label>
                ))}
                <label className="flex items-center gap-2 p-3 cursor-pointer" style={inputStyle}>
                  <input type="radio" name="addr" checked={selectedAddrId === NEW} onChange={() => setSelectedAddrId(NEW)} />
                  <span className="type-body">{t.addNewAddress}</span>
                </label>
              </div>
            )}

            {(selectedAddrId === NEW || !loggedIn || addresses.length === 0) && (
              <div className="flex flex-col gap-3">
                <AddressAutocomplete value={addr} onChange={setAddr} lang={lang} />
                {loggedIn ? (
                  <>
                    <input placeholder={t.addressLabel} value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
                    <input placeholder={t.receiverName} value={recvName} onChange={(e) => setRecvName(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
                    <input placeholder={t.receiverPhone} value={recvPhone} onChange={(e) => setRecvPhone(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
                  </>
                ) : (
                  <Link href={`/${lang}/logga-in`} className="type-caps ink-muted self-start hover:text-[var(--dusty-terracotta)]" style={{ fontSize: "0.75rem" }}>
                    {t.logInToSave}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        <input placeholder={t.dietaryNeeds} value={dietary} onChange={(e) => setDietary(e.target.value)} className="p-3 type-body bg-transparent" style={inputStyle} />
        <textarea placeholder={t.orderNotes} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="p-3 type-body bg-transparent" style={inputStyle} />

        <button type="submit" disabled={sending} className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40" style={{ border: "1px solid var(--warm-cocoa)" }}>
          {sending ? t.sending : t.submitRequest}
        </button>
        {error && <p className="type-body" role="alert" aria-live="assertive" style={{ color: "var(--dusty-wine)" }}>{error}</p>}
      </form>
    </div>
  );
}
