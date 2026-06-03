import { chat } from "@/lib/ai/chat";
import { askSystem, adaptSystem, adaptUser } from "@/lib/ai/prompts";
import { aiDetect } from "@/lib/allergen/provider";
import { buildLabel } from "@/lib/allergen/engine";
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
      const answer = await chat({
        system: askSystem(lang),
        user: `Question: ${question}\n\nUser context: ${ctx}`,
      });
      return json({ answer });
    }

    if (body.mode === "adapt") {
      const target = body.target === "vegan" ? "vegan" : "vegetarian";
      const recipe = body.recipe as { title?: string; ingredients?: { qty: string; item: string }[] };
      if (!recipe?.ingredients?.length) return json({ error: "bad_recipe" }, 400);

      const input = {
        title: String(recipe.title ?? "").slice(0, 120),
        ingredients: recipe.ingredients.slice(0, 40),
      };

      const raw = await chat({
        system: adaptSystem(lang),
        user: adaptUser(input, target),
        json: true,
        temperature: 0.3,
      });
      const parsed = JSON.parse(raw) as {
        summary?: string;
        swaps?: { from: string; to: string; note: string }[];
        adaptedIngredients?: { qty: string; item: string }[];
      };

      // Recompute the allergen label for the adapted version (M1 engine).
      let allergens = null;
      const ingStrings = (parsed.adaptedIngredients ?? []).map((i) => `${i.qty} ${i.item}`);
      if (ingStrings.length) {
        const detected = await aiDetect(ingStrings);
        const label = buildLabel(detected, ingStrings);
        allergens = { codes: label.codes, declaration: label.declaration };
      }

      return json({
        summary: parsed.summary ?? "",
        swaps: parsed.swaps ?? [],
        adaptedIngredients: parsed.adaptedIngredients ?? [],
        allergens,
      });
    }

    return json({ error: "unknown_mode" }, 400);
  } catch (e) {
    // Don't leak internal error text (could include provider/key details) in prod.
    const detail =
      process.env.NODE_ENV === "production" ? undefined : e instanceof Error ? e.message : String(e);
    return json({ error: "ai_error", ...(detail ? { detail } : {}) }, 500);
  }
}
