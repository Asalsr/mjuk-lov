// Every order email carries the Swedish message first, then the same content in
// English, in one message — so the recipient can read it regardless of their
// preferred language. Use these to compose the subject and body.

/** "Orderbekräftelse / Order confirmation" */
export function bilingualSubject(sv: string, en: string): string {
  return `${sv} / ${en}`;
}

/** Plain-text body: Swedish block, divider, English block. */
export function bilingualText(sv: string, en: string): string {
  return `${sv}\n\n–––––––––––\n\n${en}`;
}

/** HTML body: Swedish block, rule, English block. */
export function bilingualHtml(sv: string, en: string): string {
  return (
    `<div lang="sv">${sv}</div>` +
    `<hr style="border:none;border-top:1px solid #d9b7a8;margin:24px 0" />` +
    `<div lang="en">${en}</div>`
  );
}
