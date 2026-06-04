"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setProfile } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";

export function MyPageClient({
  lang,
  email,
  profile,
  favorites,
  wishlist,
  notes,
  made,
  orders,
  isOwner = false,
  titles,
}: {
  lang: Lang;
  email: string;
  isOwner?: boolean;
  profile: { fullName: string; address: string };
  favorites: string[];
  wishlist: string[];
  notes: { slug: string; body: string }[];
  made: string[];
  orders: {
    id: string;
    status: string;
    created_at: string;
    desired_date: string | null;
    items: { qty: number; name: string; nameSv: string }[] | null;
  }[];
  titles: Record<string, string>;
}) {
  const t = ui[lang];
  const router = useRouter();
  const [name, setName] = useState(profile.fullName);
  const [address, setAddress] = useState(profile.address);
  const [msg, setMsg] = useState<string | null>(null);
  const titleOf = (slug: string) => titles[slug] ?? slug;

  const signOut = async () => {
    await createClient().auth.signOut();
    router.refresh();
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ fullName: name, address }); // write-through to Supabase
    setMsg(t.synced);
  };

  const inputStyle = { border: "1px solid rgba(61, 42, 34, 0.2)" } as const;

  return (
    <div>
      <p className="type-caps opacity-60 mb-1">
        {t.loggedInAs} {email}
      </p>
      <div className="flex items-center gap-6 mb-10">
        <button
          onClick={signOut}
          className="type-caps opacity-60 transition-colors hover:text-[var(--dusty-terracotta)]"
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

      <h2 className="type-caps opacity-50 mb-4">{t.profileHeading}</h2>
      <form onSubmit={saveProfile} className="flex flex-col gap-4 mb-3 max-w-[420px]">
        <label className="flex flex-col gap-1">
          <span className="type-caps opacity-50" style={{ fontSize: "0.6875rem" }}>{t.name}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 type-body bg-transparent" style={inputStyle} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="type-caps opacity-50" style={{ fontSize: "0.6875rem" }}>{t.address}</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3 type-body bg-transparent" style={inputStyle} />
        </label>
        <button type="submit" className="type-caps tap px-6 py-3 self-start transition-all hover:bg-[var(--warm-peach)]" style={{ border: "1px solid var(--warm-cocoa)" }}>
          {t.save}
        </button>
      </form>
      {msg && <p className="type-body opacity-70 mb-2">{msg}</p>}
      <p className="type-caps opacity-40 mb-12" style={{ fontSize: "0.625rem" }}>{t.autoSyncNote}</p>

      {orders.length > 0 && (
        <>
          <h2 className="type-caps opacity-50 mb-3">{t.orders}</h2>
          <ul className="type-body mb-10 space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-col">
                <span>
                  {(o.items ?? []).map((it) => `${it.qty}× ${lang === "sv" ? it.nameSv : it.name}`).join(", ") || "—"}
                </span>
                <span className="type-caps opacity-50" style={{ fontSize: "0.625rem" }}>
                  {new Date(o.created_at).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")}
                  {" · "}
                  {o.status === "requested" ? t.statusRequested : o.status}
                  {o.desired_date ? ` · ${o.desired_date}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="type-caps opacity-50 mb-3">{t.mySaved}</h2>
      {favorites.length ? (
        <ul className="type-body mb-10 list-disc pl-5">{favorites.map((s) => <li key={s}>{titleOf(s)}</li>)}</ul>
      ) : (
        <p className="type-body opacity-60 mb-10">{t.nothingYet}</p>
      )}

      <h2 className="type-caps opacity-50 mb-3">{t.myWishlist}</h2>
      {wishlist.length ? (
        <ul className="type-body mb-10 list-disc pl-5">{wishlist.map((s) => <li key={s}>{titleOf(s)}</li>)}</ul>
      ) : (
        <p className="type-body opacity-60 mb-10">{t.nothingYet}</p>
      )}

      <h2 className="type-caps opacity-50 mb-3">{t.myNotesHeading}</h2>
      {notes.length ? (
        <ul className="type-body mb-10 space-y-2">
          {notes.map((n) => (
            <li key={n.slug}>
              <span className="opacity-60">{titleOf(n.slug)}:</span> {n.body}
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body opacity-60 mb-10">{t.nothingYet}</p>
      )}

      <h2 className="type-caps opacity-50 mb-3">{t.myHistory}</h2>
      {made.length ? (
        <ul className="type-body list-disc pl-5">{made.map((s) => <li key={s}>{titleOf(s)}</li>)}</ul>
      ) : (
        <p className="type-body opacity-60">{t.nothingYet}</p>
      )}
    </div>
  );
}
