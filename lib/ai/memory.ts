import type { createClient } from "@/lib/supabase/server";
import { chat } from "./chat";
import type { Lang } from "@/lib/i18n";

// Server-side, cross-device assistant memory (M10). Only ever used for a
// logged-in user who has explicitly opted in (Art. 9 — storing allergy-derived
// conversation is special-category processing). Every operation is best-effort:
// memory must never block or break the assistant's answer.

type DB = Awaited<ReturnType<typeof createClient>>;

const RECENT_TURNS = 6; // last N messages replayed verbatim as context
const SUMMARISE_EVERY = 8; // refresh the rolling summary every N stored messages
const CONTEXT_CAP = 1500; // chars — mirrors the per-request userContext cap

/** True only if the user has an explicit, granted `ai_memory` consent on record. */
export async function hasMemoryConsent(db: DB, userId: string): Promise<boolean> {
  const { data } = await db
    .from("consents")
    .select("granted")
    .eq("user_id", userId)
    .eq("kind", "ai_memory")
    .maybeSingle();
  return Boolean(data?.granted);
}

/** A bounded context block (rolling summary + recent turns), or "" if none/error. */
export async function loadMemory(db: DB, userId: string): Promise<string> {
  try {
    const [{ data: sum }, { data: recent }] = await Promise.all([
      db.from("ai_summary").select("summary").eq("user_id", userId).maybeSingle(),
      db
        .from("ai_messages")
        .select("role, content")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(RECENT_TURNS),
    ]);
    const parts: string[] = [];
    if (sum?.summary) parts.push(`What we already know about this baker: ${sum.summary}`);
    if (recent?.length) {
      const turns = [...recent].reverse().map((m) => `${m.role}: ${m.content}`).join("\n");
      parts.push(`Recent conversation:\n${turns}`);
    }
    return parts.join("\n\n").slice(0, CONTEXT_CAP);
  } catch {
    return "";
  }
}

/** Persist one Q&A turn; every SUMMARISE_EVERY messages, refresh the summary. */
export async function saveTurn(
  db: DB,
  userId: string,
  question: string,
  answer: string,
  lang: Lang,
): Promise<void> {
  try {
    await db.from("ai_messages").insert([
      { user_id: userId, role: "user", content: question },
      { user_id: userId, role: "assistant", content: answer },
    ]);
    const { count } = await db
      .from("ai_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (count && count % SUMMARISE_EVERY === 0) await refreshSummary(db, userId, lang);
  } catch {
    /* best-effort */
  }
}

/** Delete all of a user's durable memory (also gives erasure granularity for M11). */
export async function clearMemory(db: DB, userId: string): Promise<void> {
  await Promise.all([
    db.from("ai_messages").delete().eq("user_id", userId),
    db.from("ai_summary").delete().eq("user_id", userId),
  ]);
}

/** Distil the recent transcript into a few sentences, capping replayed context. */
async function refreshSummary(db: DB, userId: string, lang: Lang): Promise<void> {
  const { data: msgs } = await db
    .from("ai_messages")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (!msgs?.length) return;
  const convo = [...msgs].reverse().map((m) => `${m.role}: ${m.content}`).join("\n");
  const system =
    lang === "sv"
      ? "Sammanfatta vad vi vet om den här bakaren (preferenser, kost, allergier, smak) i 2–4 korta meningar. Returnera endast sammanfattningen."
      : "Summarise what we know about this baker (preferences, diet, allergies, taste) in 2–4 short sentences. Return only the summary.";
  const summary = (await chat({ system, user: convo, maxTokens: 200, temperature: 0.2 })).slice(0, 1000);
  await db
    .from("ai_summary")
    .upsert({ user_id: userId, summary, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}
