import { SERVER_KEY } from "../key";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

type Comp = { longText?: string; types?: string[] };

// Proxy for Google Places API (New) place details → structured address.
// GET /api/places/details?id=<placeId>&session=<token>
export async function GET(req: Request) {
  if (!SERVER_KEY) return json({ error: "not_configured" }, 503);

  const url = new URL(req.url);
  const id = (url.searchParams.get("id") ?? "").trim();
  const session = url.searchParams.get("session") ?? "";
  if (!id) return json({ error: "bad_request" }, 400);

  try {
    const endpoint = `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}${session ? `?sessionToken=${encodeURIComponent(session)}` : ""}`;
    const res = await fetch(endpoint, {
      headers: {
        "X-Goog-Api-Key": SERVER_KEY,
        "X-Goog-FieldMask": "addressComponents,formattedAddress",
      },
    });
    if (!res.ok) {
      console.error("places/details failed", res.status, await res.text());
      return json({ error: "upstream", status: res.status }, 502);
    }
    const data = (await res.json()) as { addressComponents?: Comp[]; formattedAddress?: string };
    const comps = data.addressComponents ?? [];
    const find = (type: string) => comps.find((c) => c.types?.includes(type));
    const num = find("street_number")?.longText ?? "";
    const route = find("route")?.longText ?? "";
    const postalCode = find("postal_code")?.longText ?? "";
    const city =
      (find("postal_town") || find("locality") || find("administrative_area_level_2"))?.longText ?? "";
    return json({
      address: { street: `${route} ${num}`.trim(), postalCode, city },
      formatted: data.formattedAddress ?? "",
    });
  } catch (e) {
    console.error("places/details threw", e);
    return json({ error: "upstream" }, 502);
  }
}
