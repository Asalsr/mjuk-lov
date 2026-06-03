import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { AiAllergenResult } from "./engine";

// Dev convenience: pick up the API key from a local .env or spike/.env so the
// author-time `npm run label` works without exporting env vars by hand.
function loadDotEnv(p: string) {
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}
loadDotEnv(path.join(process.cwd(), ".env"));
loadDotEnv(path.join(process.cwd(), "spike", ".env"));

const PROVIDER = process.env.PROVIDER || "openai";

const SYSTEM = `You are a food-safety assistant for a Swedish dessert business.
Given a recipe's ingredient list (Swedish and/or English), identify which of the
14 EU major allergens (Reg 1169/2011 Annex II) are present.

Use ONLY these exact codes:
gluten, crustaceans, egg, fish, peanut, soy, milk, nuts, celery, mustard,
sesame, sulphites, lupin, molluscs.

Reasoning rules:
- "kokosgrädde"/"coconut cream"/"kokosmjölk" is dairy-free → NOT milk.
- "mandelmjöl"/"almond flour" is nuts → NOT gluten. "glutenfritt mjöl" is gluten-free.
- Wine, marsala and dried fruit usually carry sulphites.
- Chocolate, margarine and pre-made bases often hide soy/milk → put in needsReview, don't guess.
- Be conservative: if unsure, use needsReview, do not assert.

Return ONLY JSON of this shape (do NOT write any declaration text yourself):
{ "allergens": [{"code": "<code>", "from": "ingredient that triggered it"}], "needsReview": ["note"] }`;

export async function aiDetect(ingredients: string[]): Promise<AiAllergenResult> {
  const user = `Ingredients:\n- ${ingredients.join("\n- ")}`;
  return PROVIDER === "claude" ? claudeJSON(user) : openaiJSON(user);
}

async function openaiJSON(user: string): Promise<AiAllergenResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set (env var, .env, or spike/.env)");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function claudeJSON(user: string): Promise<AiAllergenResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set (env var, .env, or spike/.env)");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM,
      messages: [{ role: "user", content: user + "\n\nReturn ONLY the JSON object." }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content as { text?: string }[]).map((b) => b.text || "").join("");
  return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
}
