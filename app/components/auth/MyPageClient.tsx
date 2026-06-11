"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setProfile } from "@/lib/userdata/store";
import type { Offer } from "@/lib/offers";
import { ui, type Lang } from "@/lib/i18n";

export function MyPageClient({
  lang,
  email,
  userId,
  profile,
  favorites,
  wishlist,
  notes,
  made,
  orders,
  memoryConsent,
  memoryCount,
  marketingConsent,
  offers,
  isOwner = false,
  titles,
}: {
  lang: Lang;
  email: string;
  userId: string;
  isOwner?: boolean;
  profile: { fullName: string; phone: string; address: string };
  favorites: string[];
  wishlist: string[];
  notes: { slug: string; body: string }[];
  made: string[];
  memoryConsent: boolean;
  memoryCount: number;
  marketingConsent: boolean;
  offers: Offer[];
  orders: {
    id: string;
    status: string;
    created_at: string;
    desired_date: string | null;
    fulfilment: string | null;
    quoted_price: number | null;
    items: { qty: number; name: string; nameSv: string }[] | null;
  }[];
  titles: Record<string, string>;
}) {
  const t = ui[lang];
  const router = useRouter();
  const [name, setName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [justSaved, setJustSaved] = useState(false);
  const [memOn, setMemOn] = useState(memoryConsent);
  const [memCount, setMemCount] = useState(memoryCount);
  const [memCleared, setMemCleared] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delPassword, setDelPassword] = useState("");
  const [delError, setDelError] = useState<string | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [marketOn, setMarketOn] = useState(marketingConsent);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  }, []);
  const titleOf = (slug: string) => titles[slug] ?? slug;

  const statusLabel = (s: string) =>
    ({ requested: t.statusRequested, confirmed: t.statusConfirmed, declined: t.statusDeclined, done: t.statusDone } as Record<string, string>)[s] ?? s;
  const statusColor = (s: string) =>
    ({ requested: "var(--dusty-terracotta)", confirmed: "var(--warm-cocoa)", done: "var(--dusty-wine)", declined: "#6e5a50" } as Record<string, string>)[s] ?? "var(--warm-cocoa)";

  const activeOrders = orders.filter((o) => o.status === "requested" || o.status === "confirmed");
  const pastOrders = orders.filter((o) => o.status === "done" || o.status === "declined");

  const OrderRow = (o: (typeof orders)[number]) => (
    <li key={o.id} className="flex flex-col gap-1 py-3" style={{ borderTop: "1px solid rgba(61, 42, 34, 0.1)" }}>
      <div className="flex items-start justify-between gap-3">
        <span className="type-body">
          {(o.items ?? []).map((it) => `${it.qty}× ${lang === "sv" ? it.nameSv : it.name}`).join(", ") || "—"}
        </span>
        <span
          className="type-caps shrink-0"
          style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", color: "var(--vanilla-cream)", backgroundColor: statusColor(o.status) }}
        >
          {statusLabel(o.status)}
        </span>
      </div>
      <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>
        {new Date(o.created_at).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")}
        {o.desired_date ? ` · ${o.desired_date}` : ""}
        {o.fulfilment ? ` · ${o.fulfilment === "delivery" ? t.delivery : t.pickup}` : ""}
      </span>
      {o.quoted_price != null && (
        <span className="type-body" style={{ fontSize: "0.875rem" }}>
          <b>{t.confirmedPrice}: {o.quoted_price} kr</b>
        </span>
      )}
    </li>
  );

  const signOut = async () => {
    await createClient().auth.signOut();
    // Navigate home rather than refreshing in place, so logout from any
    // account context lands on the public landing page (never a 404).
    router.push("/");
    router.refresh();
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ fullName: name, phone }); // write-through to Supabase
    setJustSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setJustSaved(false), 12000);
  };

  // AI memory consent + erasure run through the browser client; RLS scopes
  // every row to this signed-in user, so no service key is involved.
  const toggleMemory = async (on: boolean) => {
    setMemOn(on); // optimistic — the toggle is low-stakes and reversible
    setMemCleared(false);
    await createClient()
      .from("consents")
      .upsert(
        { user_id: userId, kind: "ai_memory", granted: on, updated_at: new Date().toISOString() },
        { onConflict: "user_id,kind" },
      );
  };

  // Personalized-offers consent. Refresh so the server can mint/clear the
  // offer on the next render (offers are minted server-side on this page).
  const toggleMarketing = async (on: boolean) => {
    setMarketOn(on);
    await createClient()
      .from("consents")
      .upsert(
        { user_id: userId, kind: "marketing", granted: on, updated_at: new Date().toISOString() },
        { onConflict: "user_id,kind" },
      );
    router.refresh();
  };

  const offerValue = (o: Offer) =>
    o.kind === "percent" ? t.offerPercentOff(o.value) : t.offerFixedOff(Math.round(o.value / 100));
  const offerReason = (key: string | null) =>
    key === "returning" ? t.offerReasonReturning : key === "firstKit" ? t.offerReasonFirstKit : "";

  const clearAiMemory = async () => {
    const db = createClient();
    await Promise.all([
      db.from("ai_messages").delete().eq("user_id", userId),
      db.from("ai_summary").delete().eq("user_id", userId),
    ]);
    setMemCount(0);
    setMemCleared(true);
  };

  // GDPR self-service. Export streams a JSON download; delete re-auths with the
  // password server-side, anonymises retained order records, then erases the rest.
  const downloadExport = async () => {
    const res = await fetch("/api/account/export", { method: "POST" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mjuk-lov-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    if (delBusy || !delPassword) return;
    setDelBusy(true);
    setDelError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: delPassword }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
        return;
      }
      setDelError(out.error === "invalid_password" ? t.deleteWrongPassword : t.deleteFailed);
    } catch {
      setDelError(t.deleteFailed);
    } finally {
      setDelBusy(false);
    }
  };

  const inputStyle = { border: "1px solid rgba(61, 42, 34, 0.2)" } as const;

  return (
    <div>
      <p className="type-caps ink-muted mb-1">
        {t.loggedInAs} {email}
      </p>
      <div className="flex items-center gap-6 mb-10">
        <button
          onClick={signOut}
          className="type-caps ink-muted transition-colors hover:text-[var(--dusty-terracotta)]"
        >
          {t.logOut}
        </button>
        {isOwner && (
          <Link
            href={`/${lang}/admin`}
            className="type-caps transition-colors hover:opacity-70"
            style={{ color: "var(--dusty-terracotta)" }}
          >
            {t.manageOrders} →
          </Link>
        )}
      </div>

      <h2 className="type-caps ink-muted mb-4">{t.profileHeading}</h2>
      <form onSubmit={saveProfile} className="flex flex-col gap-4 mb-3 max-w-[420px]">
        <label className="flex flex-col gap-1">
          <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{t.name}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 type-body bg-transparent" style={inputStyle} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{t.phone}</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 type-body bg-transparent" style={inputStyle} />
        </label>
        <button
          type="submit"
          aria-live="polite"
          className="type-caps tap px-6 py-3 self-start transition-all hover:bg-[var(--warm-peach)]"
          style={
            justSaved
              ? { border: "1px solid var(--dusty-terracotta)", backgroundColor: "var(--warm-peach)", color: "var(--warm-cocoa)" }
              : { border: "1px solid var(--warm-cocoa)" }
          }
        >
          {justSaved ? `✓ ${t.saveThanks}` : t.save}
        </button>
      </form>
      <p className="type-caps ink-muted mb-12" style={{ fontSize: "0.75rem" }}>{t.autoSyncNote}</p>

      <h2 className="type-caps ink-muted mb-3">{t.offersHeading}</h2>
      <label className="flex items-start gap-3 mb-4 cursor-pointer max-w-[420px]">
        <input type="checkbox" checked={marketOn} onChange={(e) => toggleMarketing(e.target.checked)} className="mt-1" />
        <span className="type-body ink-muted" style={{ fontSize: "0.85rem" }}>{t.marketingConsent}</span>
      </label>
      {marketOn && offers.length > 0 && (
        <ul className="mb-12 flex flex-col gap-3 max-w-[420px]">
          {offers.map((o) => (
            <li key={o.code} className="p-4" style={{ border: "1px solid var(--warm-cocoa)" }}>
              <div className="type-caps" style={{ color: "var(--dusty-terracotta)" }}>{offerValue(o)}</div>
              {offerReason(o.reasonKey) && (
                <p className="type-body ink-muted" style={{ fontSize: "0.85rem" }}>{offerReason(o.reasonKey)}</p>
              )}
              <div className="type-caps mt-2" style={{ letterSpacing: "0.05em" }}>{o.code}</div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="type-caps ink-muted mb-3">{t.aiMemoryHeading}</h2>
      <label className="flex items-start gap-3 mb-3 cursor-pointer max-w-[420px]">
        <input type="checkbox" checked={memOn} onChange={(e) => toggleMemory(e.target.checked)} className="mt-1" />
        <span className="type-body ink-muted" style={{ fontSize: "0.85rem" }}>{t.aiMemoryConsent}</span>
      </label>
      {memCount > 0 ? (
        <div className="flex items-center gap-4 mb-12">
          <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{t.aiMemoryCount(memCount)}</span>
          <button
            type="button"
            onClick={clearAiMemory}
            className="type-caps tap px-4 py-2 transition-all hover:bg-[var(--warm-peach)]"
            style={{ border: "1px solid var(--warm-cocoa)" }}
          >
            {t.clearAiMemory}
          </button>
        </div>
      ) : (
        <p className="type-caps ink-muted mb-12" role="status" aria-live="polite" style={{ fontSize: "0.75rem" }}>
          {memCleared ? t.aiMemoryCleared : " "}
        </p>
      )}

      {activeOrders.length > 0 && (
        <>
          <h2 className="type-caps ink-muted mb-1">{t.activeOrders}</h2>
          <ul className="mb-10">{activeOrders.map(OrderRow)}</ul>
        </>
      )}

      {pastOrders.length > 0 && (
        <>
          <h2 className="type-caps ink-muted mb-1">{t.pastOrders}</h2>
          <ul className="mb-10" style={{ opacity: 0.7 }}>{pastOrders.map(OrderRow)}</ul>
        </>
      )}

      <h2 className="type-caps ink-muted mb-3">{t.mySaved}</h2>
      {favorites.length ? (
        <ul className="type-body mb-10 list-disc pl-5">{favorites.map((s) => <li key={s}><Link href={`/${lang}/recept/${s}`} className="underline transition-colors hover:text-[var(--dusty-terracotta)]">{titleOf(s)}</Link></li>)}</ul>
      ) : (
        <p className="type-body ink-muted mb-10">{t.nothingYet}</p>
      )}

      <h2 className="type-caps ink-muted mb-3">{t.myWishlist}</h2>
      {wishlist.length ? (
        <ul className="type-body mb-10 list-disc pl-5">{wishlist.map((s) => <li key={s}><Link href={`/${lang}/recept/${s}`} className="underline transition-colors hover:text-[var(--dusty-terracotta)]">{titleOf(s)}</Link></li>)}</ul>
      ) : (
        <p className="type-body ink-muted mb-10">{t.nothingYet}</p>
      )}

      <h2 className="type-caps ink-muted mb-3">{t.myNotesHeading}</h2>
      {notes.length ? (
        <ul className="type-body mb-10 space-y-2">
          {notes.map((n) => (
            <li key={n.slug}>
              <Link href={`/${lang}/recept/${n.slug}`} className="ink-muted transition-colors hover:text-[var(--dusty-terracotta)]">
                {titleOf(n.slug)}:
              </Link>{" "}
              {n.body}
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body ink-muted mb-10">{t.nothingYet}</p>
      )}

      <h2 className="type-caps ink-muted mb-3">{t.myHistory}</h2>
      {made.length ? (
        <ul className="type-body list-disc pl-5">{made.map((s) => <li key={s}><Link href={`/${lang}/recept/${s}`} className="underline transition-colors hover:text-[var(--dusty-terracotta)]">{titleOf(s)}</Link></li>)}</ul>
      ) : (
        <p className="type-body ink-muted">{t.nothingYet}</p>
      )}

      <div className="mt-14 pt-8" style={{ borderTop: "1px solid rgba(61, 42, 34, 0.12)" }}>
        <h2 className="type-caps ink-muted mb-4">{t.accountDataHeading}</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={downloadExport}
            className="type-caps tap px-5 py-3 transition-all hover:bg-[var(--warm-peach)]"
            style={{ border: "1px solid var(--warm-cocoa)" }}
          >
            {t.exportMyData}
          </button>
          {!delOpen && (
            <button
              type="button"
              onClick={() => { setDelOpen(true); setDelError(null); }}
              className="type-caps tap px-5 py-3 transition-colors hover:bg-[var(--dusty-wine)] hover:text-[var(--vanilla-cream)]"
              style={{ border: "1px solid var(--dusty-wine)", color: "var(--dusty-wine)" }}
            >
              {t.deleteAccount}
            </button>
          )}
        </div>

        {delOpen && (
          <div className="mt-5 max-w-[460px] p-5" style={{ border: "1px solid var(--dusty-wine)" }}>
            <p className="type-body ink-muted mb-4" style={{ fontSize: "0.875rem" }}>{t.deleteAccountWarning}</p>
            <input
              type="password"
              value={delPassword}
              onChange={(e) => setDelPassword(e.target.value)}
              placeholder={t.password}
              aria-label={t.password}
              autoComplete="current-password"
              className="w-full p-3 type-body bg-transparent mb-3"
              style={inputStyle}
            />
            {delError && (
              <p className="type-body mb-3" role="alert" aria-live="assertive" style={{ color: "var(--dusty-wine)", fontSize: "0.875rem" }}>
                {delError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={delBusy || !delPassword}
                className="type-caps tap px-5 py-3 transition-all disabled:opacity-40"
                style={{ border: "1px solid var(--dusty-wine)", color: "var(--vanilla-cream)", backgroundColor: "var(--dusty-wine)" }}
              >
                {t.confirmDelete}
              </button>
              <button
                type="button"
                onClick={() => { setDelOpen(false); setDelPassword(""); setDelError(null); }}
                className="type-caps ink-muted tap px-3 transition-colors hover:text-[var(--dusty-terracotta)]"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
