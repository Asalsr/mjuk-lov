// Normalizes every product photo in public/gallery/ to one uniform canvas size,
// so the raw files (and any consumer that honours their intrinsic dimensions)
// all present at the same size as the reference photo. The site itself already
// renders these in a fixed aspect-ratio `object-cover` frame, so this is about
// the FILES being consistent — matching previews on GitHub/editors, and giving
// `object-cover` an identical crop to work from.
//
// These are Adobe-exported SVGs wrapping one embedded raster image. We never
// touch the pixels: we only rewrite the outer <svg> `width`/`height`/`viewBox`.
// A file that is taller/wider than the reference is CENTER-CROPPED by insetting
// its viewBox (no distortion, equal trim on both sides) — never squished.
//
// The target size is the MAJORITY size in the folder — the dimensions shared by
// the most files — not any one named file. The gallery filenames drift (photos
// get swapped and renamed), so pinning to a single reference file would break
// the moment that file is replaced; the majority is self-healing. Idempotent:
// files already at the target aspect are left untouched.
//
//   npm run normalize-gallery          # rewrite files in place
//   npm run normalize-gallery -- --check   # report only, change nothing (exit 1 if any drift)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const GALLERY_DIR = path.join(process.cwd(), "public", "gallery");
const EPS = 0.5; // px slack when comparing aspect ratios

const check = process.argv.includes("--check");

type SvgDims = { width: number; height: number; vb: [number, number, number, number] };

/** Pull width/height/viewBox from the opening <svg> tag (the tag ends at the
 *  first `>`, before <metadata>; attributes never contain `>`). */
function parseSvg(source: string, file: string): { openTag: string; dims: SvgDims } {
  const m = source.match(/<svg\b[^>]*>/);
  if (!m) throw new Error(`${file}: no <svg> opening tag found`);
  const openTag = m[0];
  const width = Number(openTag.match(/\bwidth="([\d.]+)"/)?.[1]);
  const height = Number(openTag.match(/\bheight="([\d.]+)"/)?.[1]);
  const vbRaw = openTag.match(/\bviewBox="([\d.\s-]+)"/)?.[1];
  if (!Number.isFinite(width) || !Number.isFinite(height) || !vbRaw) {
    throw new Error(`${file}: missing width/height/viewBox`);
  }
  const vb = vbRaw.trim().split(/\s+/).map(Number);
  if (vb.length !== 4 || vb.some((n) => !Number.isFinite(n))) {
    throw new Error(`${file}: unparseable viewBox "${vbRaw}"`);
  }
  return { openTag, dims: { width, height, vb: vb as [number, number, number, number] } };
}

/** Trim to 6 decimals, drop trailing zeros — matches the exporter's style. */
const fmt = (n: number) => Number(n.toFixed(6)).toString();

/** Pick the target size: the width×height shared by the most files (ties broken
 *  by the alphabetically-first size key, so the result is deterministic). */
function pickTarget(dimsByFile: Map<string, SvgDims>): SvgDims {
  const tally = new Map<string, { dims: SvgDims; count: number }>();
  for (const dims of dimsByFile.values()) {
    const key = `${dims.width}x${dims.height}`;
    const hit = tally.get(key);
    if (hit) hit.count++;
    else tally.set(key, { dims, count: 1 });
  }
  const winner = [...tally.entries()].sort((a, b) =>
    b[1].count - a[1].count || a[0].localeCompare(b[0]),
  )[0];
  if (!winner) throw new Error("No gallery SVGs found");
  return winner[1].dims;
}

function main() {
  const files = readdirSync(GALLERY_DIR).filter((f) => f.toLowerCase().endsWith(".svg"));
  const dimsByFile = new Map<string, SvgDims>();
  for (const file of files) {
    dimsByFile.set(file, parseSvg(readFileSync(path.join(GALLERY_DIR, file), "utf8"), file).dims);
  }

  const ref = pickTarget(dimsByFile);
  const targetAspect = ref.width / ref.height; // width / height
  console.log(`Target size (majority of ${files.length} files): ${fmt(ref.width)}x${fmt(ref.height)}\n`);
  let changed = 0;

  for (const file of files) {
    const full = path.join(GALLERY_DIR, file);
    const source = readFileSync(full, "utf8");
    const { openTag, dims } = parseSvg(source, file);
    const [minX, minY, vbW, vbH] = dims.vb;
    const aspect = vbW / vbH;

    const aspectOk = Math.abs(aspect - targetAspect) < EPS / Math.max(vbW, vbH);
    const sizeOk = dims.width === ref.width && dims.height === ref.height;
    if (aspectOk && sizeOk) continue; // already normalized

    // Center-crop the viewBox to the reference aspect (never distort).
    let nb: [number, number, number, number];
    if (aspect > targetAspect) {
      const newW = vbH * targetAspect; // too wide → trim left/right
      nb = [minX + (vbW - newW) / 2, minY, newW, vbH];
    } else {
      const newH = vbW / targetAspect; // too tall → trim top/bottom
      nb = [minX, minY + (vbH - newH) / 2, vbW, newH];
    }

    if (check) {
      console.log(`DRIFT  ${file}  ${dims.width}x${dims.height} vb[${dims.vb.map(fmt).join(" ")}]`);
      changed++;
      continue;
    }

    const newTag = openTag
      .replace(/\bwidth="[\d.]+"/, `width="${fmt(ref.width)}"`)
      .replace(/\bheight="[\d.]+"/, `height="${fmt(ref.height)}"`)
      .replace(/\bviewBox="[\d.\s-]+"/, `viewBox="${nb.map(fmt).join(" ")}"`);
    writeFileSync(full, source.replace(openTag, newTag), "utf8");
    console.log(`normalized  ${file}  →  ${fmt(ref.width)}x${fmt(ref.height)} (center-crop)`);
    changed++;
  }

  const target = `${fmt(ref.width)}x${fmt(ref.height)}`;
  if (check) {
    console.log(
      changed === 0
        ? `\nAll ${files.length} gallery photos are ${target}.`
        : `\n${changed} file(s) drift from ${target}. Run: npm run normalize-gallery`,
    );
    process.exit(changed === 0 ? 0 : 1);
  }
  console.log(`\nDone — ${changed} file(s) normalized, ${files.length - changed} already matched ${target}.`);
}

main();
