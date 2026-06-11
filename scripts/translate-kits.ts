// Fill the Persian (fa) side of every localized field in the kit build guides,
// translating idiomatically from English. sv/en are the source of truth.
//   npm run translate-kits
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { chat } from "../lib/ai/chat";
import { KitGuideSchema } from "../lib/kits/schema";

const DIR = path.join(process.cwd(), "content", "kits");

const SYSTEM = `You are a native Persian (fa-IR) food writer localizing a Swedish dessert brand's DIY cake-kit build guides into natural, idiomatic Persian — NEVER word-by-word.
Rules:
- Output Persian only. Keep the brand name "Mjuk Lov" Latin, never transliterated.
- Preserve temperature tokens exactly (e.g. "215°C" stays "215°C"); keep other numbers as Western digits.
- Use the formal register (شما, verb endings -ید).
- Preserve array length and order EXACTLY.
Return ONLY JSON: { "title": string, "intro": string, "steps": string[], "tips": string[] }`;

async function runOne(slug: string): Promise<void> {
  const file = path.join(DIR, `${slug}.json`);
  const g = KitGuideSchema.parse(JSON.parse(readFileSync(file, "utf8")));
  const src = {
    title: g.title.en,
    intro: g.intro.en,
    steps: g.steps.map((s) => s.text.en),
    tips: g.tips.map((t) => t.en),
  };
  const raw = await chat({ system: SYSTEM, user: JSON.stringify(src), json: true, maxTokens: 1500, temperature: 0.3 });
  const fa = JSON.parse(raw) as { title?: string; intro?: string; steps?: string[]; tips?: string[] };
  const at = (arr: string[] | undefined, i: number, fb: string) => arr?.[i] || fb;

  const out = {
    ...g,
    title: { ...g.title, fa: fa.title || g.title.en },
    intro: { ...g.intro, fa: fa.intro || g.intro.en },
    steps: g.steps.map((s, i) => ({ ...s, text: { ...s.text, fa: at(fa.steps, i, s.text.en) } })),
    tips: g.tips.map((t, i) => ({ ...t, fa: at(fa.tips, i, t.en) })),
  };
  const parsed = KitGuideSchema.safeParse(out);
  if (!parsed.success) throw new Error(`Invalid after translation (${slug}):\n${parsed.error.message}`);
  writeFileSync(file, JSON.stringify(parsed.data, null, 2) + "\n", "utf8");
  console.log(`✓ fa filled → content/kits/${slug}.json`);
}

async function main() {
  const slugs = readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  for (const slug of slugs) {
    try {
      await runOne(slug);
    } catch (e) {
      console.error(`✗ ${slug}: ${e instanceof Error ? e.message : e}`);
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
