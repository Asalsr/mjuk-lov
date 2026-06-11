// Author-time QR generator for the DIY-kit companion pages. Writes one SVG per
// kit guide into public/kits/<id>-qr.svg, encoding the public companion URL.
// These are an asset hand-off for whoever prints the physical boxes — the boxes
// are offline, so this is NOT a runtime endpoint.
//
//   SITE_URL=https://mjuklov.se npm run kit-qr
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { getKitGuides } from "../lib/kits";

const SITE_URL = (process.env.SITE_URL || "https://mjuklov.se").replace(/\/$/, "");
const OUT_DIR = path.join(process.cwd(), "public", "kits");

async function main() {
  const guides = getKitGuides();
  if (!guides.length) {
    console.error("No kit guides found in content/kits/. Add a guide first.");
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const g of guides) {
    const url = `${SITE_URL}/sv/kit/${g.id}`;
    const svg = await QRCode.toString(url, { type: "svg", margin: 2 });
    writeFileSync(path.join(OUT_DIR, `${g.id}-qr.svg`), svg, "utf8");
    console.log(`${g.id}  →  ${url}  (public/kits/${g.id}-qr.svg)`);
  }
  console.log(`\nDone — ${guides.length} QR code(s) written. Hand these to whoever prints the boxes.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
