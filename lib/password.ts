import { ui, type Lang } from "@/lib/i18n";

/** Mirrors the `minLength` enforced on the password inputs. */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Checks we can run in the browser before hitting the server, so the user sees
 * exactly what's wrong as they type rather than a generic browser tooltip.
 * Mirrors the Supabase auth policy: min length + "letters and digits" (at
 * least one letter and one digit). The leaked-password check is server-only
 * and is surfaced via weakPasswordIssues.
 */
export function localPasswordIssues(password: string, lang: Lang): string[] {
  const t = ui[lang];
  const issues: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) issues.push(t.passwordTooShort);
  if (!/[a-zA-Z]/.test(password)) issues.push(t.passwordNeedsLetter);
  if (!/[0-9]/.test(password)) issues.push(t.passwordNeedsDigit);
  return issues;
}

/**
 * Translates a Supabase auth error into the specific, localized reasons a
 * password was rejected. Returns null when the error isn't a weak-password one
 * (caller should fall back to the raw message).
 *
 * Supabase reports weak passwords as `code === "weak_password"` with a
 * `reasons` array (e.g. "length", "characters", "pwned"). The "characters"
 * reason is a single catch-all for the lower/upper/digit/symbol policy, so we
 * derive the precise missing classes from the password itself.
 */
export function weakPasswordIssues(
  error: { code?: string; message?: string; reasons?: string[] } | null,
  password: string,
  lang: Lang,
): string[] | null {
  if (!error) return null;
  const isWeak =
    error.code === "weak_password" ||
    Array.isArray(error.reasons) ||
    /password/i.test(error.message ?? "");
  if (!isWeak) return null;

  const t = ui[lang];
  const reasons = error.reasons ?? [];
  const issues: string[] = [];

  if (reasons.includes("length") || password.length < MIN_PASSWORD_LENGTH) {
    issues.push(t.passwordTooShort);
  }
  if (reasons.includes("characters")) {
    if (!/[a-zA-Z]/.test(password)) issues.push(t.passwordNeedsLetter);
    if (!/[0-9]/.test(password)) issues.push(t.passwordNeedsDigit);
  }
  if (reasons.includes("pwned")) issues.push(t.passwordPwned);

  // Recognised it as a password problem but couldn't map a specific reason —
  // fall back to the server's own message rather than an empty list.
  if (issues.length === 0) return error.message ? [error.message] : null;
  return issues;
}
