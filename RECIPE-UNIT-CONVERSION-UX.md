# Recipe unit-conversion UX — findings & task list

> Reference for fixing the measurement-conversion experience on the recipe
> detail pages. Combines a verified deep-research pass (2026-06-11) with the
> current code. Work the **Task list** at the bottom top-to-bottom.
>
> **Scope note:** the structured data model the research recommends
> (`{value, unit}` + per-ingredient density) **already exists** in
> `lib/recipes/schema.ts` + `lib/units/`. So this is largely a **UX correction**
> (remove per-row clutter, unify the controls, extend temp conversion into
> steps) — not a from-scratch build.

---

## TL;DR recommendation

1. **Remove the per-ingredient unit dropdown** on every row. Keep **one
   recipe-wide control**. (This is the "repeating themselves so many times"
   pain — and it's the part with *no* supporting evidence in the research.)
2. **Grams stay primary** for baking; show US cups as a clearly *approximate*
   convenience. You already default to metric — good.
3. **`tsp`/`tbsp` → grams only when that ingredient has a density.** There is
   **no universal spoon/cup→gram multiplier**; without a density, leave the
   source unit unchanged rather than invent a number. (That's *why* your `tsp`
   doesn't convert today — the ingredient has no `densityKey`.)
4. **Make temps in step prose obey the global °C/°F preference** ("Bake … at
   215°C"), via author-time dual values or a runtime temp tokenizer. **Leave
   cooking times static.**
5. **Unify** the ingredient system toggle and the oven °C/°F toggle into a
   single persisted preference, applied everywhere (ingredients + oven field +
   step temps).

---

## Current state (verified in code)

| Piece | File | Behaviour today |
|---|---|---|
| Structured quantity | `lib/recipes/schema.ts` — `Quantity = {value, unit} \| {text}` | ✅ already structured (research's #1 data-model ask, done) |
| Per-ingredient density | `lib/units/densities.ts` + `densityKey` on ingredient | ✅ exists; volume↔weight only offered when density known |
| Global system toggle | `IngredientList.tsx` — Metric / US (cups) | ✅ exists, metric default, persisted in `localStorage["mjuklov_units"]` |
| **Per-row unit dropdown** | `IngredientList.tsx` — `<select>` on every row | ❌ **the clutter to remove** |
| Oven temp toggle | `OvenTemp.tsx` — °C/°F | ⚠️ works **only** on a structured oven field; **its own local state**, not tied to the global preference |
| Step-prose temps | `content/recipes/*.json` `steps[]` (free text) | ❌ "215°C" inside steps never converts |
| Times | step prose | — stay static (correct) |

---

## Findings (cited)

### 1. Grams primary for baking — **HIGH confidence**
Volume measurement of flour is "wildly inconsistent": one nominal cup of AP
flour ranges **~120 g (fluffed/leveled) to ~160 g (packed)** — a 25–40% swing,
up to 3–4 tbsp/cup; cocoa varies ~2 tbsp; liquid cups read inconsistently. King
Arthur and professional pastry practice explicitly recommend weighing. → Keep
**grams authoritative**; treat US-cup output as a **~approximate** convenience.
*Sources: King Arthur ingredient-weight-chart, how-to-measure-flour,
weighing-ingredients; StressBaking; Baker Bettie.*

### 2. Volume↔weight is ingredient-specific — **HIGH confidence**
There is **no universal cup→gram or spoon→gram multiplier**. Same volume, different
weight per ingredient: AP flour 120 g/cup, almond flour 96 g/cup, shredded
coconut 53 g/cup, granulated sugar ~198 g/cup, honey ~336 g/cup; baking powder
1 tsp = 4 g, honey 1 tbsp = 21 g, vanilla 1 tbsp = 14 g. **Only water** has
fl-oz = weight-oz. → Each ingredient needs an **optional density**; where it's
unknown, **show no synthesized gram/cup value** (leave the source unit).
*Sources: King Arthur ingredient-weight-chart; StressBaking; Baker Bettie; recipecard.io.*

### 3. Convert the whole recipe with ONE control — **MEDIUM confidence**
Recipe converter/scaling tools operate on the entire recipe via a single control
(system toggle and/or a multiplier / servings stepper). **None use per-row
dropdowns.** *Honest caveat:* the evidence is strongest for proportional
**scaling**; the specific claim that tools use system-level unit buttons was
*refuted 0–3*. Net: per-row dropdowns have **zero** supporting evidence and add
repetition, so removing them is safe — but "one global unit-system toggle" is
inferred, not proven universal. *Sources: recipecard.io (converter, unit-converter).*

### 4. Structured ingredient model — **HIGH confidence** (already satisfied)
Model ingredients as numeric **value + machine-readable unit code** (schema.org
`PropertyValue`: `value` + `unitCode`, e.g. UN/CEFACT `G21`), units stored
separately from magnitude, with an optional per-ingredient density. *Note:*
`value` can be a fraction string ("3/4") in schema.org. **Your schema already
does this** — consider also emitting `PropertyValue` in the JSON-LD for SEO.
*Sources: schema.org/Recipe, schema.org/PropertyValue.*

### 5. In-step temps are conventionally static text — **MEDIUM confidence**
`HowToStep` carries only instructional **text** — no temperature/quantity field
(Google's example embeds "425°F" as plain prose). So there's no *structured*
hook for in-step temps. *Caveat:* that governs SEO markup, **not** display UX —
you're free to (and arguably should) make in-step temps convertible. → Apply the
global °C/°F preference inside step prose via **authored dual values
("215°C / 420°F")** or a **runtime temp tokenizer**; **leave times static**.
*Sources: Google Recipe structured-data docs; schema.org/Recipe.*

### 6. Persist preference client-side — **MEDIUM confidence**
`localStorage` is the right place for a client-only preference (like dark mode),
metric default; never leaves the client → light GDPR footprint. **Two caveats
for your Next.js SSR setup:** (1) resolve the unit *before/at hydration* (inline
script or cookie) to avoid a **metric→US flash** on first paint; (2) the
"cookie-consent exempt" angle is a reasonable legal interpretation, not settled
law. *Source: brandur.org cookies-vs-local-storage.*

---

## Decisions you need to make (open questions from the research)

These weren't settled by sources — pick one each before the related task:

- **D1 — Ingredients with no density** (a pinch, to taste, eggs by count, fruit):
  under the global toggle, **suppress conversion for that row only** and keep the
  source unit. *(Recommended; your code already treats `count`/`text` as
  non-convertible — extend the same graceful fallback to "no density".)*
- **D2 — Step temps: authored dual-unit vs runtime parser.** Authored
  `"215°C / 420°F"` is reliable + accessible but doubles authoring and clutters
  the metric-default reader; a runtime tokenizer keeps prose clean and honors the
  toggle but must parse robustly. *Lean: runtime tokenizer bound to the global
  temp preference, since metric is your default audience.*
- **D3 — Decimal separator for sv vs en.** Should "12,5 dl" (sv comma) vs "12.5"
  (en dot) follow the **language locale**, the measurement system, or browser
  locale? No verified source. *Lean: follow the `lang` segment (sv→comma,
  en→dot).*
- **D4 — `tsp`/`tbsp` for tiny amounts.** Even with a density, do you *want*
  "1 tsp baking powder" shown as "4 g"? Many baking sites keep small spoons as
  spoons. *Lean: keep spoons as spoons by default; offer grams only where the
  amount is large enough to matter.*

---

## Task list — do top to bottom

> Each task notes the files and the finding/decision it implements. Schema is
> already structured, so most tasks are UI + content.

### Phase A — remove the clutter (highest-value, lowest-risk)
- [ ] **A1. Delete the per-row unit `<select>`** from `IngredientList.tsx`
  (`Qty` component). Keep only the single global Metric/US toggle. *(Finding 3;
  the headline pain point.)*
- [ ] **A2. Drop the per-row `overrides` state** and `optionsFor`/per-row
  `onPick` plumbing now unused. Simplify `Qty` to render the value in the
  globally-chosen system. *(Finding 3.)*
- [ ] **A3. Label US output as approximate** — show "~2 cups" / "≈" (or a small
  "approx." note) when displaying converted cup values, since volume is
  imprecise. *(Finding 1.)*

### Phase B — honest volume↔weight behaviour
- [ ] **B1. Graceful no-density fallback (D1):** when an ingredient has no
  `densityKey`, the global toggle leaves its source unit unchanged instead of
  hiding/forcing it. Confirm `count` and `text` quantities already pass through.
- [ ] **B2. Fill densities** in `lib/units/densities.ts` for the ingredients
  that actually appear in your recipes and where weight matters (flours, sugars,
  cocoa, coconut, etc.) using a **single authoritative table (King Arthur)**.
  *(Finding 2.)*
- [ ] **B3. Spoon policy (D4):** decide whether `tsp`/`tbsp` show grams even when
  a density exists; implement the chosen rule in `defaultUnitFor`. Document why
  in a comment so the next reader understands the "tsp doesn't convert" behaviour
  is intentional.

### Phase C — unify the controls into one preference
- [ ] **C1. Single recipe-wide preference store.** Promote the unit system +
  °C/°F into one persisted preference (extend `localStorage["mjuklov_units"]`
  or add a sibling key). One control bar at the top of the detail page:
  `[ Metric | US ]` for amounts and `[ °C | °F ]` for temperature. *(Findings 3, 6.)*
- [ ] **C2. Bind `OvenTemp.tsx` to that global preference** instead of its own
  local `useState`, so toggling once changes every temperature on the page.
- [ ] **C3. SSR flicker fix (Finding 6):** resolve the stored preference at/before
  hydration (inline script reading `localStorage`, or a cookie) so there's no
  metric→US flash on first paint.

### Phase D — temperatures inside step prose
- [ ] **D-impl. Implement the D2 decision.** Either (a) author dual-unit temps in
  `content/recipes/*.json` steps, or (b) add a runtime **temp tokenizer** that
  finds `\d+ ?°C|°F` in step text and renders it through the global temp
  preference. **Leave cooking times static.** *(Finding 5.)*
- [ ] **D-test. Verify** "Fill the cases full. Bake 5 min at 215°C, drop to
  190°C…" now reflects the °C/°F toggle, and times ("5 min") do not change.

### Phase E — localization, accessibility, persistence polish
- [ ] **E1. Decimal separator (D3):** format numbers per the `lang` segment
  (sv→comma, en→dot) in `lib/units/format.ts`. *(Finding 6 / open Q.)*
- [ ] **E2. Accessibility:** the toggles already use `aria-pressed` — keep
  `role="group"` + group label on the unified control; ensure focus styles. *(W3C
  APG button pattern.)*
- [ ] **E3. Confirm metric remains the default** for first-time EU/Sweden
  visitors. *(Finding 1/6.)*

### Phase F — SEO (optional, low priority)
- [ ] **F1. Emit `PropertyValue`** (`value` + `unitCode`) for ingredients in the
  recipe JSON-LD, accepting fraction strings. *(Finding 4.)*

---

## Caveats to keep in mind
- Findings **1, 2, 4** are HIGH confidence (primary King Arthur + schema.org
  sources, timeless food science). Findings **3, 5, 6** are MEDIUM — vendor/blog
  sources, one refuted competing claim, and SEO-spec inferences applied to
  display UX. None of the sources is specific to bilingual sv/en sites; the
  decimal-separator and EU-metric guidance is reasoned from your context, not a
  verified source.
- Exact density constants vary slightly between sources (flour cited as 120 vs
  125 vs 140 g/cup). Use **one** table (King Arthur) and treat constants as
  approximate.

## Key sources
- King Arthur — [Ingredient Weight Chart](https://www.kingarthurbaking.com/learn/ingredient-weight-chart), [How to measure flour](https://www.kingarthurbaking.com/blog/2023/10/13/how-to-measure-flour), [Weighing ingredients](https://www.kingarthurbaking.com/blog/2015/04/28/weighing-ingredients)
- [StressBaking — volume conversions](https://stressbaking.com/volume-conversions-for-baking-recipe-ingredients/) · [Baker Bettie — how to measure flour](https://bakerbettie.com/how-to-measure-flour/)
- [schema.org/Recipe](https://schema.org/Recipe) · [schema.org/PropertyValue](https://schema.org/PropertyValue) · [Google Recipe structured data](https://developers.google.com/search/docs/appearance/structured-data/recipe)
- [recipecard.io converter](https://recipecard.io/recipe-converter/) · [brandur.org — cookies vs localStorage](https://brandur.org/fragments/cookies-vs-local-storage) · [W3C APG — button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
