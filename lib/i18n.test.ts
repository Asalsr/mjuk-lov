import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ui } from "./i18n";

// House rule (this pass): no em dash (—) in any user-facing copy. Use a comma,
// period, colon, or the middot "·" as a separator. This guard fails if an em
// dash slips back into lib/i18n.ts. Code comments don't render, so they're
// exempt — we check exported string values, plus the source with full-line and
// block comments stripped (to catch em dashes inside function-valued strings).

const EM_DASH = "—";

/** Every string reachable in the `ui` dictionary (values + function outputs). */
function collectStrings(node: unknown, out: string[]): void {
  if (typeof node === "string") {
    out.push(node);
  } else if (typeof node === "function") {
    // Functions build strings from args; probe with a number and a string so
    // template-literal copy gets evaluated. Ignore ones that don't accept either.
    for (const arg of [1, "x"]) {
      try {
        const r = (node as (a: unknown) => unknown)(arg);
        if (typeof r === "string") out.push(r);
      } catch {
        /* arg shape didn't fit — the other probe covers it */
      }
    }
  } else if (node && typeof node === "object") {
    for (const v of Object.values(node)) collectStrings(v, out);
  }
}

describe("i18n copy has no em dashes", () => {
  it("no exported string value contains an em dash", () => {
    const strings: string[] = [];
    collectStrings(ui, strings);
    const offenders = strings.filter((s) => s.includes(EM_DASH));
    expect(offenders).toEqual([]);
  });

  it("the source (comments stripped) contains no em dash", () => {
    const src = readFileSync(fileURLToPath(new URL("./i18n.ts", import.meta.url)), "utf8");
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
      .split("\n")
      .filter((line) => !line.trim().startsWith("//")) // full-line comments
      .join("\n");
    expect(stripped.includes(EM_DASH)).toBe(false);
  });
});
