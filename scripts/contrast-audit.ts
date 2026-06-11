/**
 * Contrast audit for the Mjuk Lov palette.
 *
 * Computes WCAG 2.1 contrast ratios for the brand color pairs actually used in
 * the UI, plus the effective contrast of text rendered with `opacity-*`
 * utilities over the cream background. The opacity model mirrors what the
 * browser does: the element's color is alpha-composited over whatever is
 * directly behind it (here, the page background), then compared to that same
 * background.
 *
 * Run: npx tsx scripts/contrast-audit.ts
 *
 * This is a developer tool — it has no runtime dependencies and is safe to
 * keep in the repo as the objective baseline for the accessibility work.
 */

type RGB = { r: number; g: number; b: number };

const PALETTE = {
  vanillaCream: "#FCF2E4",
  softPeach: "#FAF3E2",
  warmPeach: "#D9B7A8",
  dustyTerracotta: "#A85D4E",
  dustyWine: "#7A3A40",
  warmCocoa: "#5C3D2E",
} as const;

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Alpha-composite `fg` (at `alpha`) over opaque `bg`. */
function composite(fg: RGB, bg: RGB, alpha: number): RGB {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  };
}

function relLuminance({ r, g, b }: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: RGB, b: RGB): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function verdict(ratio: number): string {
  // AA: 4.5 normal text, 3.0 large/UI. AAA: 7.0 normal.
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-large/UI only";
  return "FAIL";
}

const cream = hexToRgb(PALETTE.vanillaCream);

console.log("=== Solid foreground on cream (#FCF2E4) ===");
for (const [name, hex] of Object.entries(PALETTE)) {
  if (name === "vanillaCream") continue;
  const r = contrast(hexToRgb(hex), cream);
  console.log(`${name.padEnd(18)} ${r.toFixed(2).padStart(6)}:1  ${verdict(r)}`);
}

console.log("\n=== warm-cocoa text at opacity-* over cream (the dominant pattern) ===");
for (const op of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
  const composited = composite(hexToRgb(PALETTE.warmCocoa), cream, op);
  const r = contrast(composited, cream);
  console.log(`opacity-${(op * 100).toString().padStart(2)}        ${r.toFixed(2).padStart(6)}:1  ${verdict(r)}`);
}

console.log("\n=== Cream text on colored fills (badges/buttons) ===");
for (const [name, hex] of Object.entries(PALETTE)) {
  if (name === "vanillaCream" || name === "softPeach") continue;
  const r = contrast(cream, hexToRgb(hex));
  console.log(`cream on ${name.padEnd(16)} ${r.toFixed(2).padStart(6)}:1  ${verdict(r)}`);
}

console.log("\n=== Candidate muted tokens (solid, to replace text opacity) ===");
// Goal: looks ~as muted as opacity-50/60 but lands a confident AA on cream.
for (const op of [0.62, 0.66, 0.7]) {
  const composited = composite(hexToRgb(PALETTE.warmCocoa), cream, op);
  const hex = `#${[composited.r, composited.g, composited.b]
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("")}`;
  const r = contrast(composited, cream);
  console.log(`cocoa@${op} -> ${hex}   ${r.toFixed(2).padStart(6)}:1  ${verdict(r)}`);
}
