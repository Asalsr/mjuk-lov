# Recipe authoring rules

Every recipe JSON in this folder is validated against `lib/recipes/schema.ts`.
Follow these rules so the **unit converter** and **temperature display** work.
(Most of this is applied automatically by the scripts below — read them before
hand-editing.)

## Quantities are STRUCTURED, never free text

Each ingredient's `qty` is one of:

```jsonc
{ "qty": { "value": 250, "unit": "g" }, "item": { "sv": "vetemjöl", "en": "flour" }, "densityKey": "flour" }
{ "qty": { "value": 4, "unit": "piece" }, "item": { "sv": "ägg", "en": "eggs" } }          // a count (no unit shown)
{ "qty": { "text": { "sv": "till garnering", "en": "to garnish" } }, "item": { ... } }      // qualitative, not convertible
```

- **Allowed units:** `g, kg, oz, lb, ml, dl, l, tsp, tbsp, cup, floz, piece`.
- **Author in EU/metric** (the canonical form): `g`, `dl`/`ml`, `tsp` (=tsk, 5 ml), `tbsp` (=msk, 15 ml). The converter turns these into US units on demand.
- **Counts** (eggs, bananas) → `unit: "piece"`. **Qualitative** amounts ("a pinch", "to taste", "to garnish") → `{ text: {sv,en} }`.

## `densityKey` enables weight ↔ volume

To convert an ingredient between mass and volume (e.g. grams → tsp/cups), it
needs a density. Set `densityKey` to a key from `lib/units/densities.ts`
(`flour`, `sugar`, `butter`, `cocoa`, `bakingPowder`, `salt`, `vanilla`, …).
**If an ingredient isn't covered, add a new key + g/ml value to that file** and a
matching pattern to its resolver. Ingredients with no density still convert
within the same dimension (g↔oz, ml↔cups); they just can't cross mass↔volume.

You don't normally assign `densityKey` by hand — the scripts do it from the
ingredient name (see below). Re-run after adding ingredients.

## Temperatures: write `215°C`, get both scales free

Write oven temperatures in the **step text with a degree sign**, e.g.
`"Bake 15 min at 215°C."`. They render automatically as `215°C (419°F)` —
**do not** type the `(°F)` yourself. (An optional structured `oven` field also
displays both.) Author in °C.

## Richer detail (all optional)

These fields make a recipe page more practical. All are optional — omit them and
nothing breaks.

- **`equipment`**: `[{ sv, en }]` — tools needed (bowl, tray, fork…).
- **`yieldNote`**: `{ sv, en }` — a human yield beyond `servings`, e.g. `"ca 12 kakor"` / `"about 12 cookies"`.
- **`tips`**: `[{ sv, en }]` — actionable technique tips, shown as their own list (distinct from `notes`). Temperatures here render with both scales, like steps.
- **Per-step metadata**: a step may be either a bare `{ sv, en }` (legacy, still valid) **or** an object:

  ```jsonc
  { "text": { "sv": "Grädda …", "en": "Bake …" }, "durationMin": 12, "image": "/recipes/<slug>/step-4.jpg" }
  ```

  `durationMin` (positive integer minutes) shows as a small chip; `image`
  (a `/public` path or URL) renders under the step. Both optional.

## Workflow for a new recipe

```bash
npm run import -- <url>     # AI draft → structured qty + densityKey, UNPUBLISHED
npm run structure-qty       # (re)assign densityKey from names across all recipes
npm run label -- <slug>     # draft the allergen label, then human-approve
npm test                    # unit-engine + allergen tests stay green
```

Both languages (`sv` + `en`) are required on every localized string.
