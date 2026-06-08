import { SERVER_KEY } from "../key";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// Proxy for Google Places API (New) autocomplete. The key stays server-side —
// the browser never sees it. Returns a slim list of { placeId, main, secondary }.
export async function POST(req: Request) {
  if (!SERVER_KEY) return json({ error: "not_configured" }, 503);

  let body: { input?: string; sessionToken?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const input = String(body.input ?? "").trim();
  if (input.length < 3) return json({ suggestions: [] });

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": SERVER_KEY },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["se"],
        ...(body.sessionToken ? { sessionToken: body.sessionToken } : {}),
      }),
    });
    if (!res.ok) {
      console.error("places/autocomplete failed", res.status, await res.text());
      return json({ error: "upstream", status: res.status }, 502);
    }
    const data = (await res.json()) as {
      suggestions?: {
        placePrediction?: {
          placeId?: string;
          structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
          text?: { text?: string };
        };
      }[];
    };
    const suggestions = (data.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
      .map((p) => ({
        placeId: p.placeId!,
        main: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
        secondary: p.structuredFormat?.secondaryText?.text ?? "",
      }));
    return json({ suggestions });
  } catch (e) {
    console.error("places/autocomplete threw", e);
    return json({ error: "upstream" }, 502);
  }
}
