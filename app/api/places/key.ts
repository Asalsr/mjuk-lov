// Server-only Google key for the Places proxy. NOT a NEXT_PUBLIC_ var — it never
// reaches the browser. Use a key with API restriction = Places API (New) and
// application restriction = None (server calls have no HTTP referrer, so a
// referrer-restricted key would be rejected). Falls back to the public key for
// convenience in local dev, but production should set GOOGLE_MAPS_SERVER_KEY.
export const SERVER_KEY =
  process.env.GOOGLE_MAPS_SERVER_KEY ||
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "";
