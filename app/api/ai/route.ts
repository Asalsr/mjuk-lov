import { chat, currentModel } from "@/lib/ai/chat";
import { askSystem } from "@/lib/ai/prompts";
import { generateAdaptation } from "@/lib/ai/adapt";
import { aiDetect } from "@/lib/allergen/provider";
import { buildLabel } from "@/lib/allergen/engine";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasMemoryConsent, loadMemory, saveTurn } from "@/lib/ai/memory";
import type { Lang } from "@/lib/i18n";

// Needs the Node runtime (the AI/env helpers use node:fs). Never prerendered.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort in-memory rate limit. Serverless instances don't share memory, so
// this is a soft cap per instance, not a global guarantee — enough to blunt abuse.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const max = 20;
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return json({ error: "rate_limited" }, 429);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const lang: Lang = body.lang === "en" ? "en" : "sv";

  try {
    if (body.mode === "ask") {
      const question = String(body.question ?? "").slice(0, 500).trim();
      if (!question) return json({ error: "empty" }, 400);
      // userContext (diet/allergies) is only present if the user consented client-side.
      const ctx = body.userContext ? JSON.stringify(body.userContext).slice(0, 1500) : "(none)";

      // Durable cross-device memory — only for a logged-in user who has an
      // explicit `ai_memory` consent. Best-effort: with no session or no consent
      // (the default), `userId` stays null and the route is stateless, as before.
      let userId: string | null = null;
      let memory = "";
      const db = await createClient().catch(() => null);
      if (db) {
        try {
          const user = (await db.auth.getUser()).data.user;
          if (user && (await hasMemoryConsent(db, user.id))) {
            userId = user.id;
            memory = await loadMemory(db, user.id);
          }
        } catch {
          /* anonymous → stateless */
        }
      }

      const answer = await chat({
        system: askSystem(lang),
        user: `${memory ? `${memory}\n\n` : ""}Question: ${question}\n\nUser context: ${ctx}`,
      });
      if (db && userId) await saveTurn(db, userId, question, answer, lang);
      return json({ answer });
    }

    if (body.mode === "adapt") {
      const target =
        body.target === "vegan" ? "vegan" : body.target === "gluten-free" ? "gluten-free" : "vegetarian";
      const recipe = body.recipe as {
        slug?: string;
        title?: string;
        ingredients?: { qty: string; item: string }[];
      };
      if (!recipe?.ingredients?.length) return json({ error: "bad_recipe" }, 400);

      const slug = String(recipe.slug ?? "").slice(0, 200);
      const model = currentModel();
      // Shared cache, keyed on (slug, target, lang). No-op when Supabase isn't
      // configured (local dev) — we just generate every time, as before.
      const admin = isAdminConfigured && slug ? createAdminClient() : null;

      if (admin) {
        const { data } = await admin
          .from("recipe_adaptations")
          .select("result, model")
          .eq("slug", slug)
          .eq("target", target)
          .eq("lang", lang)
          .maybeSingle();
        // Hit + same model → serve instantly, no OpenAI call. A stale model
        // falls through and is regenerated synchronously below ("better AI").
        if (data && data.model === model) return json(data.result);
      }

      const input = {
        title: String(recipe.title ?? "").slice(0, 120),
        ingredients: recipe.ingredients.slice(0, 40),
      };

      // Best-of-2 + auto-validation (see lib/ai/adapt.ts).
      const parsed = await generateAdaptation(input, target, lang);
      if (!parsed) return json({ error: "ai_error" }, 500);

      // Recompute the allergen label for the adapted version (M1 engine).
      let allergens = null;
      const ingStrings = parsed.adaptedIngredients.map((i) => `${i.qty} ${i.item}`);
      if (ingStrings.length) {
        const detected = await aiDetect(ingStrings);
        const label = buildLabel(detected, ingStrings);
        allergens = { codes: label.codes, declaration: label.declaration };
      }

      const result = {
        summary: parsed.summary,
        swaps: parsed.swaps,
        adaptedIngredients: parsed.adaptedIngredients,
        tips: parsed.tips,
        allergens,
      };

      // Save for the next visitor (insert on miss, overwrite on stale model).
      if (admin) {
        await admin.from("recipe_adaptations").upsert(
          { slug, target, lang, result, model, updated_at: new Date().toISOString() },
          { onConflict: "slug,target,lang" },
        );
      }

      return json(result);
    }

    return json({ error: "unknown_mode" }, 400);
  } catch (e) {
    // Don't leak internal error text (could include provider/key details) in prod.
    const detail =
      process.env.NODE_ENV === "production" ? undefined : e instanceof Error ? e.message : String(e);
    return json({ error: "ai_error", ...(detail ? { detail } : {}) }, 500);
  }
}
