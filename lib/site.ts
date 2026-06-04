// Browser origin for building email redirect links. 0.0.0.0 is a bind address,
// not browsable — coerce it to localhost so confirmation/reset links work.
export function appOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin.replace("0.0.0.0", "localhost");
}
