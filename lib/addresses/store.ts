import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Saved delivery addresses (address book). Account-only — persisted in Supabase
// under RLS. Guests have none; the checkout falls back to a typed address.
export type DeliveryAddress = {
  id: string;
  label: string;
  street: string;
  postalCode: string;
  city: string;
  receiverName: string; // "" → fall back to the profile's name
  receiverPhone: string; // "" → fall back to the profile's phone
  isDefault: boolean;
};

export type NewAddress = Omit<DeliveryAddress, "id" | "isDefault"> & { makeDefault?: boolean };

type Row = {
  id: string;
  label: string;
  street: string;
  postal_code: string | null;
  city: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  is_default: boolean;
};

function fromRow(r: Row): DeliveryAddress {
  return {
    id: r.id,
    label: r.label,
    street: r.street,
    postalCode: r.postal_code ?? "",
    city: r.city ?? "",
    receiverName: r.receiver_name ?? "",
    receiverPhone: r.receiver_phone ?? "",
    isDefault: r.is_default,
  };
}

async function client() {
  if (!isSupabaseConfigured) return null;
  const s = createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  return user ? { s, uid: user.id } : null;
}

export async function listAddresses(): Promise<DeliveryAddress[]> {
  const c = await client();
  if (!c) return [];
  const { data } = await c.s
    .from("delivery_addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return ((data as Row[]) ?? []).map(fromRow);
}

export async function addAddress(input: NewAddress): Promise<DeliveryAddress | null> {
  const c = await client();
  if (!c) return null;
  // First address (or an explicit request) becomes the default.
  const { count } = await c.s
    .from("delivery_addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", c.uid);
  const makeDefault = input.makeDefault || (count ?? 0) === 0;
  if (makeDefault) await c.s.from("delivery_addresses").update({ is_default: false }).eq("user_id", c.uid);
  const { data, error } = await c.s
    .from("delivery_addresses")
    .insert({
      user_id: c.uid,
      label: input.label,
      street: input.street,
      postal_code: input.postalCode || null,
      city: input.city || null,
      receiver_name: input.receiverName || null,
      receiver_phone: input.receiverPhone || null,
      is_default: makeDefault,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return fromRow(data as Row);
}

export async function deleteAddress(id: string): Promise<void> {
  const c = await client();
  if (!c) return;
  await c.s.from("delivery_addresses").delete().eq("id", id);
}

export async function setDefaultAddress(id: string): Promise<void> {
  const c = await client();
  if (!c) return;
  await c.s.from("delivery_addresses").update({ is_default: false }).eq("user_id", c.uid);
  await c.s.from("delivery_addresses").update({ is_default: true }).eq("id", id);
}

/** Load the current user's address book; `refresh` re-fetches after a change. */
export function useAddresses() {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const list = await listAddresses();
    setAddresses(list);
    setLoading(false);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount, not a sync render loop
    void refresh();
  }, [refresh]);
  return { addresses, loading, refresh };
}
