import { notFound } from "next/navigation";
import { isLang, type Lang } from "@/lib/i18n";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { LegalDoc, type LegalSection } from "@/app/components/legal/LegalDoc";

// GDPR privacy policy. Tailored to what the app actually processes (accounts,
// orders, delivery addresses, diet/allergy preferences, the AI assistant) and
// the processors it uses. BEFORE LAUNCH, fill the bracketed [...] placeholders
// with the real legal entity name, organisationsnummer and registered address,
// and have the final text reviewed by someone qualified.

export const metadata = { title: "Integritetspolicy · Mjuk Lov" };

const LAST_UPDATED = "2026-06-08";

const content: Record<Lang, { title: string; intro: string; updated: string; sections: LegalSection[] }> = {
  sv: {
    title: "Integritetspolicy",
    updated: `Senast uppdaterad: ${LAST_UPDATED}`,
    intro:
      "Den här policyn beskriver hur Mjuk Lov samlar in, använder och skyddar dina personuppgifter när du använder vår webbplats, skapar ett konto och lägger en beställning. Vi följer EU:s dataskyddsförordning (GDPR) och svensk dataskyddslagstiftning.",
    sections: [
      {
        h: "1. Personuppgiftsansvarig",
        p: [
          "Ansvarig för behandlingen av dina personuppgifter är Mjuk Lov, Göteborg.",
          "Kontakt i dataskyddsfrågor: mjuklov.se@gmail.com.",
        ],
      },
      {
        h: "2. Vilka uppgifter vi behandlar",
        bullets: [
          "Konto: e‑postadress och lösenord (lagras krypterat/hashat av vår leverantör), samt namn och telefonnummer du anger.",
          "Beställningar: produkter, önskat datum, hämtning eller leverans, leveransadresser (inklusive mottagarens namn och telefon), samt din kontaktinformation.",
          "Sparade adresser: adresser du väljer att spara för återanvändning.",
          "Preferenser: kost och allergier du anger, samt sparade recept, anteckningar och tillagningshistorik. Uppgifter om allergier kan utgöra hälsouppgifter (känsliga personuppgifter).",
          "AI‑assistenten: de frågor du skriver, och – endast om du samtycker – dina sparade kost‑ och allergipreferenser.",
          "Teknisk information: data som lagras lokalt i din webbläsare (varukorg, språkval, preferenser), nödvändiga inloggningscookies samt anonym prestandastatistik.",
        ],
      },
      {
        h: "3. Ändamål och rättslig grund",
        bullets: [
          "Skapa och hantera ditt konto samt behandla och leverera din beställning – rättslig grund: fullgörande av avtal.",
          "Anpassa recept och svar utifrån dina kost‑ och allergiuppgifter och skicka dem till vår AI‑leverantör – rättslig grund: ditt uttryckliga samtycke (känsliga uppgifter). Du kan när som helst återkalla samtycket.",
          "Skicka orderbekräftelser och svar på dina förfrågningar – rättslig grund: fullgörande av avtal/berättigat intresse.",
          "Säkerhet, att förhindra missbruk och att förbättra tjänsten – rättslig grund: berättigat intresse.",
          "Bokföring av genomförda köp – rättslig grund: rättslig förpliktelse (bokföringslagen).",
        ],
      },
      {
        h: "4. Mottagare och personuppgiftsbiträden",
        p: ["Vi säljer aldrig dina uppgifter. För att driva tjänsten anlitar vi följande leverantörer som behandlar uppgifter för vår räkning:"],
        bullets: [
          "Supabase – databas, konton och autentisering.",
          "OpenAI – driver AI‑assistenten (endast de frågor och, vid samtycke, preferenser du skickar).",
          "Google Maps Platform – adressförslag vid leverans.",
          "Resend – utskick av order‑ och kontaktmejl.",
          "Vercel – webbhotell och anonym prestandastatistik (Speed Insights).",
          "Stripe – betalningar (om/när betalning aktiveras).",
        ],
      },
      {
        h: "5. Överföring till tredjeland",
        p: [
          "Vissa av våra leverantörer kan behandla uppgifter utanför EU/EES (t.ex. i USA). När så sker grundas överföringen på EU‑kommissionens standardavtalsklausuler eller ett giltigt adekvansbeslut, med lämpliga skyddsåtgärder.",
        ],
      },
      {
        h: "6. Lagringstid",
        bullets: [
          "Kontouppgifter: så länge ditt konto är aktivt. Du kan radera ditt konto när som helst.",
          "Order‑ och bokföringsunderlag: så länge som krävs enligt bokföringslagen (normalt sju år).",
          "Preferenser och sparade adresser: tills du ändrar eller raderar dem.",
        ],
      },
      {
        h: "7. Dina rättigheter",
        p: ["Enligt GDPR har du rätt att:"],
        bullets: [
          "begära tillgång till och en kopia av dina uppgifter,",
          "rätta felaktiga uppgifter,",
          "radera dina uppgifter (”rätten att bli bortglömd”),",
          "begränsa eller invända mot behandlingen,",
          "få ut dina uppgifter i ett maskinläsbart format (dataportabilitet),",
          "när som helst återkalla samtycke du lämnat.",
        ],
      },
      {
        h: "8. Klagomål",
        p: [
          "Du kan utöva dina rättigheter genom att mejla mjuklov.se@gmail.com. Är du missnöjd med hur vi behandlar dina uppgifter har du rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY), imy.se.",
        ],
      },
      {
        h: "9. Cookies och lokal lagring",
        p: [
          "Vi använder nödvändiga inloggningscookies för att hålla dig inloggad, samt lokal lagring i din webbläsare för varukorg, språkval och dina preferenser. Dessa krävs för att tjänsten ska fungera. Vi använder inga annons‑ eller spårningscookies. Vår prestandastatistik (Vercel Speed Insights) är anonym och kopplas inte till dig.",
        ],
      },
      {
        h: "10. Säkerhet",
        p: [
          "Uppgifter överförs krypterat (HTTPS), lösenord lagras hashade och åtkomst till kontodata begränsas på radnivå så att du bara kommer åt dina egna uppgifter.",
        ],
      },
      {
        h: "11. Barn",
        p: [
          "Tjänsten riktar sig inte till barn. Vi samlar inte medvetet in uppgifter om barn under 13 år utan vårdnadshavares samtycke.",
        ],
      },
      {
        h: "12. Ändringar",
        p: [
          "Vi kan uppdatera denna policy. Väsentliga ändringar meddelas på webbplatsen. Datumet högst upp visar när policyn senast ändrades.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: `Last updated: ${LAST_UPDATED}`,
    intro:
      "This policy explains how Mjuk Lov collects, uses and protects your personal data when you use our website, create an account and place an order. We comply with the EU General Data Protection Regulation (GDPR) and Swedish data protection law.",
    sections: [
      {
        h: "1. Data controller",
        p: [
          "The controller of your personal data is Mjuk Lov, based in Gothenburg, Sweden.",
          "Data protection contact: mjuklov.se@gmail.com.",
        ],
      },
      {
        h: "2. Data we process",
        bullets: [
          "Account: email and password (stored encrypted/hashed by our provider), plus the name and phone number you provide.",
          "Orders: products, desired date, pickup or delivery, delivery addresses (including the recipient's name and phone), and your contact details.",
          "Saved addresses: addresses you choose to save for reuse.",
          "Preferences: the diet and allergies you enter, plus saved recipes, notes and cooking history. Allergy information may constitute health data (a special category of personal data).",
          "AI assistant: the questions you type and — only if you consent — your saved diet/allergy preferences.",
          "Technical data: data stored locally in your browser (cart, language choice, preferences), essential authentication cookies, and anonymous performance metrics.",
        ],
      },
      {
        h: "3. Purposes and legal bases",
        bullets: [
          "Creating and managing your account and processing and delivering your order — legal basis: performance of a contract.",
          "Adapting recipes/answers to your diet and allergy data and sending them to our AI provider — legal basis: your explicit consent (special-category data). You can withdraw consent at any time.",
          "Sending order confirmations and replies to your enquiries — legal basis: contract / legitimate interest.",
          "Security, preventing misuse and improving the service — legal basis: legitimate interest.",
          "Keeping accounting records of completed purchases — legal basis: legal obligation (Swedish Bookkeeping Act).",
        ],
      },
      {
        h: "4. Recipients and processors",
        p: ["We never sell your data. To run the service we use the following providers, who process data on our behalf:"],
        bullets: [
          "Supabase — database, accounts and authentication.",
          "OpenAI — powers the AI assistant (only the questions and, with consent, the preferences you send).",
          "Google Maps Platform — address suggestions for delivery.",
          "Resend — sending order and contact emails.",
          "Vercel — hosting and anonymous performance metrics (Speed Insights).",
          "Stripe — payments (if/when payment is enabled).",
        ],
      },
      {
        h: "5. International transfers",
        p: [
          "Some of our providers may process data outside the EU/EEA (e.g. in the USA). Where this happens, the transfer relies on the European Commission's Standard Contractual Clauses or a valid adequacy decision, with appropriate safeguards.",
        ],
      },
      {
        h: "6. Retention",
        bullets: [
          "Account data: for as long as your account is active. You can delete your account at any time.",
          "Orders and accounting records: for as long as required by the Swedish Bookkeeping Act (normally seven years).",
          "Preferences and saved addresses: until you change or delete them.",
        ],
      },
      {
        h: "7. Your rights",
        p: ["Under the GDPR you have the right to:"],
        bullets: [
          "request access to and a copy of your data,",
          "rectify inaccurate data,",
          "erase your data (the “right to be forgotten”),",
          "restrict or object to processing,",
          "receive your data in a machine-readable format (data portability),",
          "withdraw any consent you have given, at any time.",
        ],
      },
      {
        h: "8. Complaints",
        p: [
          "You can exercise your rights by emailing mjuklov.se@gmail.com. If you are unhappy with how we handle your data, you have the right to lodge a complaint with the Swedish Authority for Privacy Protection (IMY), imy.se.",
        ],
      },
      {
        h: "9. Cookies and local storage",
        p: [
          "We use essential authentication cookies to keep you signed in, and local storage in your browser for the cart, language choice and your preferences. These are required for the service to work. We do not use advertising or tracking cookies. Our performance metrics (Vercel Speed Insights) are anonymous and not linked to you.",
        ],
      },
      {
        h: "10. Security",
        p: [
          "Data is transferred over encrypted connections (HTTPS), passwords are stored hashed, and access to account data is restricted at the row level so you can only reach your own data.",
        ],
      },
      {
        h: "11. Children",
        p: [
          "The service is not directed at children. We do not knowingly collect data about children under 13 without a guardian's consent.",
        ],
      },
      {
        h: "12. Changes",
        p: [
          "We may update this policy. Material changes will be announced on the website. The date at the top shows when the policy was last changed.",
        ],
      },
    ],
  },
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = content[lang];

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/integritetspolicy`}>
      <LegalDoc lang={lang} title={t.title} updated={t.updated} intro={t.intro} sections={t.sections} />
    </RecipeShell>
  );
}
