// Fill in the missing `youtubeId` values in lib/recipeVideos.ts using the
// YouTube Data API v3, scoped to each entry's official channel so we never embed
// a reupload. Picks the best title match, prefers embeddable videos, and writes
// the ids back into the data file. Review the diff before committing.
//
// Needs YOUTUBE_API_KEY (local .env or .env.local; or exported in the shell).
// Run: npm run resolve-videos
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { recipeVideos } from "../lib/recipeVideos";

const API = "https://www.googleapis.com/youtube/v3";

/** Read YOUTUBE_API_KEY from the shell or a local dotenv file (no dep needed). */
function loadKey(): string | undefined {
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY;
  for (const f of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*YOUTUBE_API_KEY\s*=\s*(.*?)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, "").trim();
    }
  }
  return undefined;
}

const KEY = loadKey();
if (!KEY) {
  console.error(
    "Missing YOUTUBE_API_KEY.\n" +
      "Add it to your local .env (in the project root), e.g.:\n" +
      "  YOUTUBE_API_KEY=AIza...\n",
  );
  process.exit(1);
}

type Cand = { videoId: string; title: string };

/** Resolve a channelId field (UC… id, @handle, c/custom, plain custom) to a UC… id. */
const channelCache = new Map<string, string | null>();
async function resolveChannelId(raw: string): Promise<string | null> {
  if (raw.startsWith("UC")) return raw;
  if (channelCache.has(raw)) return channelCache.get(raw)!;
  const handle = raw.replace(/^@/, "").replace(/^c\//, "");
  let id: string | null = null;
  try {
    const r = await fetch(`${API}/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${KEY}`);
    const j = await r.json();
    id = j.items?.[0]?.id ?? null;
  } catch {
    /* fall through */
  }
  if (!id) {
    try {
      const r = await fetch(`${API}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(handle)}&key=${KEY}`);
      const j = await r.json();
      id = j.items?.[0]?.id?.channelId ?? j.items?.[0]?.snippet?.channelId ?? null;
    } catch {
      /* give up */
    }
  }
  channelCache.set(raw, id);
  return id;
}

async function searchVideos(channelId: string, query: string): Promise<Cand[]> {
  const url =
    `${API}/search?part=snippet&type=video&videoEmbeddable=true&maxResults=3` +
    `&channelId=${channelId}&q=${encodeURIComponent(query)}&key=${KEY}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error.errors ?? j.error));
  return (j.items ?? []).map((it: { id: { videoId: string }; snippet: { title: string } }) => ({
    videoId: it.id.videoId,
    title: it.snippet.title,
  }));
}

/** Fraction of the recipe's significant words present in the video title (0–1). */
function score(query: string, title: string): number {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const t = title.toLowerCase();
  if (!words.length) return 0;
  return words.filter((w) => t.includes(w)).length / words.length;
}

async function main() {
  const targets = recipeVideos.filter((v) => !v.youtubeId);
  console.log(`Resolving ${targets.length} videos missing an id…\n`);

  const found: { id: number; videoId: string }[] = [];
  for (const v of targets) {
    try {
      const cid = await resolveChannelId(v.channelId);
      if (!cid) {
        console.log(`✗ #${v.id} ${v.recipe} — channel "${v.channelId}" not resolved`);
        continue;
      }
      const cands = await searchVideos(cid, v.recipe);
      if (!cands.length) {
        console.log(`✗ #${v.id} ${v.recipe} — no results on ${v.channel}`);
        continue;
      }
      const best = cands.map((c) => ({ ...c, s: score(v.recipe, c.title) })).sort((a, b) => b.s - a.s)[0];
      const mark = best.s >= 0.5 ? "✓" : "?";
      console.log(`${mark} #${v.id} ${v.recipe} → ${best.videoId}  "${best.title}"  [${Math.round(best.s * 100)}%]`);
      found.push({ id: v.id, videoId: best.videoId });
    } catch (e) {
      console.log(`✗ #${v.id} ${v.recipe} — ${(e as Error).message}`);
    }
  }

  // Write ids back into the data file, per entry (matched by unique `id:`).
  const file = path.join(process.cwd(), "lib", "recipeVideos.ts");
  let src = readFileSync(file, "utf8");
  let written = 0;
  for (const r of found) {
    const re = new RegExp(`(\\{\\s*id:\\s*${r.id}\\b[\\s\\S]*?)youtubeId:\\s*null`, "m");
    if (re.test(src)) {
      src = src.replace(re, `$1youtubeId: ${JSON.stringify(r.videoId)}`);
      written++;
    }
  }
  writeFileSync(file, src);
  console.log(`\nWrote ${written} id(s) into lib/recipeVideos.ts.`);
  console.log("✓ = confident match, ? = low title match (eyeball these). Review the git diff before committing.");
}

main();
