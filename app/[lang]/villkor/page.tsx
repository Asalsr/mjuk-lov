import { notFound } from "next/navigation";
import { isLang, type Lang } from "@/lib/i18n";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { LegalDoc, type LegalSection } from "@/app/components/legal/LegalDoc";

// Terms of use & purchase, tailored to the request-to-order flow and EU consumer
// law (Directive 2011/83/EU; Swedish lag (2005:59) om distansavtal). Note the
// withdrawal-right exemption for perishable / made-to-order food. BEFORE LAUNCH,
// fill the bracketed [...] placeholders and have the text reviewed.

export const metadata = { title: "Villkor · Mjuk Lov" };

const LAST_UPDATED = "2026-06-08";

// Legal text is sv/en only; /fa falls back to English until professionally translated.
const content: Record<"sv" | "en", { title: string; intro: string; updated: string; sections: LegalSection[] }> = {
  sv: {
    title: "Användarvillkor & köpvillkor",
    updated: `Senast uppdaterad: ${LAST_UPDATED}`,
    intro:
      "Dessa villkor gäller när du använder webbplatsen och beställer från Mjuk Lov. De påverkar inte dina tvingande rättigheter som konsument enligt svensk lag och EU‑rätt.",
    sections: [
      {
        h: "1. Om oss",
        p: [
          "Säljare är Mjuk Lov, Göteborg. Kontakt: mjuklov.se@gmail.com.",
        ],
      },
      {
        h: "2. Så fungerar en beställning",
        p: [
          "Vår beställning sker som en förfrågan. När du skickar din varukorg får vi en förfrågan med dina önskemål. Ett bindande avtal uppstår först när vi bekräftar din beställning med slutpris och tillgänglighet via e‑post. Priser som visas i varukorgen är uppskattningar tills beställningen bekräftats.",
        ],
      },
      {
        h: "3. Priser och betalning",
        p: [
          "Priser anges i svenska kronor (SEK) och inkluderar moms där så är tillämpligt. Betalning sker enligt de instruktioner vi anger i orderbekräftelsen. När kortbetalning är aktiverad sker den via vår betalleverantör.",
        ],
      },
      {
        h: "4. Leverans och hämtning",
        bullets: [
          "Leverans sker inom Göteborg. En leveransavgift på 79 kr tillkommer; hämtning är avgiftsfri.",
          "Beställningar görs minst 3 dagar i förväg. Vi bekräftar datum i orderbekräftelsen.",
          "Du ansvarar för att lämna korrekt leveransadress och kontaktuppgifter till mottagaren.",
        ],
      },
      {
        h: "5. Ångerrätt",
        p: [
          "Enligt lagen om distansavtal (2005:59) och EU‑direktiv 2011/83/EU gäller normalt 14 dagars ångerrätt vid distansköp. Ångerrätten gäller dock inte varor som tillverkas enligt dina anvisningar eller får en tydlig personlig prägel, och inte heller färskvaror eller livsmedel som snabbt kan försämras.",
          "Eftersom våra tårtor och kit tillverkas på beställning och är färskvaror omfattas de därför normalt inte av ångerrätten. Kontakta oss så snart som möjligt om du behöver ändra eller avboka – se nedan.",
        ],
      },
      {
        h: "6. Avbokning och ändringar",
        p: [
          "Hör av dig så snart som möjligt om du vill ändra eller avboka. Innan tillverkningen påbörjats försöker vi alltid tillmötesgå ändringar. När tillverkningen påbörjats kan vi inte alltid erbjuda återbetalning, eftersom varan är en färskvara gjord för dig.",
        ],
      },
      {
        h: "7. Allergener och livsmedelssäkerhet",
        p: [
          "Vårt kök hanterar gluten, mjölk, ägg, mandel och hasselnötter, och korskontaminering kan förekomma. Vi kan inte garantera att en produkt är helt fri från ett visst allergen.",
          "Du ansvarar för att informera oss om allergier och kostbehov vid beställning. Kontrollera alltid förpackningen på de varor som ingår, eftersom märkningar kan variera mellan tillverkare.",
        ],
      },
      {
        h: "8. Ditt konto",
        p: [
          "Du ansvarar för att uppgifterna du lämnar är korrekta och för att hålla ditt lösenord skyddat. Hör av dig om du misstänker obehörig åtkomst.",
        ],
      },
      {
        h: "9. Webbplatsen och AI‑assistenten",
        p: [
          "AI‑assistenten ger förslag i informationssyfte och ersätter inte din egen kontroll av ingrediens‑ och allergiinformation. Förlita dig aldrig enbart på AI‑svar vid allergier. Webbplatsen får inte användas på ett olagligt eller skadligt sätt.",
        ],
      },
      {
        h: "10. Ansvar",
        p: [
          "Vi ansvarar i den utsträckning som följer av tvingande lag. Inget i dessa villkor begränsar dina lagstadgade konsumenträttigheter, t.ex. rätten att reklamera felaktiga varor.",
        ],
      },
      {
        h: "11. Reklamation och tvistlösning",
        p: [
          "Kontakta oss på mjuklov.se@gmail.com vid problem så löser vi det. Om vi inte kommer överens kan du vända dig till Allmänna reklamationsnämnden (ARN), arn.se, vars beslut vi följer.",
        ],
      },
      {
        h: "12. Tillämplig lag",
        p: [
          "Svensk lag tillämpas på dessa villkor. Som konsument har du alltid kvar det skydd som gäller enligt tvingande lag i ditt hemland.",
        ],
      },
      {
        h: "13. Ändringar",
        p: [
          "Vi kan uppdatera dessa villkor. Den version som gäller är den som publicerats på webbplatsen när du gör din beställning.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of Use & Purchase",
    updated: `Last updated: ${LAST_UPDATED}`,
    intro:
      "These terms apply when you use the website and order from Mjuk Lov. They do not affect your mandatory rights as a consumer under Swedish law and EU law.",
    sections: [
      {
        h: "1. About us",
        p: [
          "The seller is Mjuk Lov, based in Gothenburg, Sweden. Contact: mjuklov.se@gmail.com.",
        ],
      },
      {
        h: "2. How an order works",
        p: [
          "Orders are placed as a request. When you submit your cart we receive an enquiry with your wishes. A binding contract is formed only when we confirm your order, with a final price and availability, by email. Prices shown in the cart are estimates until the order is confirmed.",
        ],
      },
      {
        h: "3. Prices and payment",
        p: [
          "Prices are shown in Swedish kronor (SEK) and include VAT where applicable. Payment is made according to the instructions in our order confirmation. When card payment is enabled, it is handled by our payment provider.",
        ],
      },
      {
        h: "4. Delivery and pickup",
        bullets: [
          "Delivery is within Gothenburg. A delivery fee of 79 kr applies; pickup is free.",
          "Orders are placed at least 3 days in advance. We confirm the date in the order confirmation.",
          "You are responsible for providing a correct delivery address and recipient contact details.",
        ],
      },
      {
        h: "5. Right of withdrawal",
        p: [
          "Under the Swedish Distance Contracts Act (2005:59) and EU Directive 2011/83/EU, distance purchases normally carry a 14-day right of withdrawal. However, this right does not apply to goods made to your specifications or clearly personalised, nor to perishable goods or foodstuffs that may deteriorate quickly.",
          "Because our cakes and kits are made to order and are perishable, they are therefore normally not covered by the right of withdrawal. Please contact us as soon as possible if you need to change or cancel; see below.",
        ],
      },
      {
        h: "6. Cancellations and changes",
        p: [
          "Contact us as soon as possible if you want to change or cancel. Before production begins we will always try to accommodate changes. Once production has started we cannot always offer a refund, since the item is a perishable good made for you.",
        ],
      },
      {
        h: "7. Allergens and food safety",
        p: [
          "Our kitchen handles gluten, milk, eggs, almonds and hazelnuts, and cross-contamination can occur. We cannot guarantee that a product is entirely free from a given allergen.",
          "You are responsible for informing us of allergies and dietary needs when ordering. Always check the packaging of the products included, as labels can vary between manufacturers.",
        ],
      },
      {
        h: "8. Your account",
        p: [
          "You are responsible for providing accurate information and for keeping your password secure. Contact us if you suspect unauthorised access.",
        ],
      },
      {
        h: "9. The website and AI assistant",
        p: [
          "The AI assistant provides suggestions for information purposes and does not replace your own checking of ingredient and allergen information. Never rely on AI answers alone where allergies are concerned. The website may not be used in any unlawful or harmful way.",
        ],
      },
      {
        h: "10. Liability",
        p: [
          "We are liable to the extent required by mandatory law. Nothing in these terms limits your statutory consumer rights, such as the right to complain about faulty goods.",
        ],
      },
      {
        h: "11. Complaints and dispute resolution",
        p: [
          "Contact us at mjuklov.se@gmail.com if there is a problem and we will resolve it. If we cannot agree, you may refer the matter to the Swedish National Board for Consumer Disputes (ARN), arn.se, whose decisions we follow.",
        ],
      },
      {
        h: "12. Governing law",
        p: [
          "Swedish law applies to these terms. As a consumer you always retain the protection afforded by the mandatory law of your country of residence.",
        ],
      },
      {
        h: "13. Changes",
        p: [
          "We may update these terms. The version that applies is the one published on the website when you place your order.",
        ],
      },
    ],
  },
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = content[lang === "fa" ? "en" : lang];

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/villkor`}>
      <LegalDoc lang={lang} title={t.title} updated={t.updated} intro={t.intro} sections={t.sections} />
    </RecipeShell>
  );
}
