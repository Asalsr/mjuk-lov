"use client";

import type { Seller } from "@/lib/seller";
import { isVatRegistered } from "@/lib/seller";
import type { Lang } from "@/lib/i18n";

// Printable receipt (kvitto). Bilingual by design — every label shows Swedish
// then English ("Totalt / Total"), so one document serves all customers. The
// data is passed in by the (server-rendered) receipt page; this component is
// purely presentational plus a Print / Save-as-PDF button.
//
// Not VAT-registered → this is a kvitto, not a momsfaktura. When the business
// sets a VAT number (lib/seller.ts), isVatRegistered() flips and the footer
// note is dropped.

export interface ReceiptLine {
  name: string;
  qty: number;
  lineTotalSek: number;
}

export interface ReceiptData {
  orderNumber: string;
  dateLabel: string; // already-formatted date string
  customerName: string;
  fulfilment?: "pickup" | "delivery" | null;
  address?: string | null;
  lines: ReceiptLine[];
  subtotalSek: number;
  deliveryFeeSek: number;
  totalSek: number;
  /** true = paid by card (kit checkout); false = paid on pickup/delivery (request order). */
  paid: boolean;
}

const kr = (n: number) => `${n.toLocaleString("sv-SE")} kr`;

export function Receipt({
  data,
  seller,
  lang,
}: {
  data: ReceiptData;
  seller: Seller;
  lang: Lang;
}) {
  const vat = isVatRegistered(seller);
  const print = lang === "sv" ? "Skriv ut / Spara som PDF" : lang === "fa" ? "چاپ / ذخیره PDF" : "Print / Save as PDF";

  return (
    <div>
      {/* Self-contained print rules: show only the receipt, hide everything else. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt, .receipt * { visibility: visible; }
          .receipt { position: absolute; inset: 0; margin: 0; padding: 24px; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="receipt" style={{ maxWidth: 640, margin: "0 auto", color: "var(--warm-cocoa)" }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="type-serif" style={{ fontSize: "1.5rem" }}>{seller.name}</div>
            <div className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>{seller.address}</div>
            {seller.orgNumber && (
              <div className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>Org.nr {seller.orgNumber}</div>
            )}
            {vat && (
              <div className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>VAT {seller.vatNumber}</div>
            )}
          </div>
          <div className="type-caps" style={{ fontSize: "0.875rem", textAlign: "right" }}>
            {vat ? "Faktura / Invoice" : "Kvitto / Receipt"}
          </div>
        </div>

        <dl className="mb-6" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.25rem 1rem" }}>
          <dt className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>Ordernr / Order no.</dt>
          <dd className="type-body">{data.orderNumber}</dd>
          <dt className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>Datum / Date</dt>
          <dd className="type-body">{data.dateLabel}</dd>
          <dt className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>Kund / Customer</dt>
          <dd className="type-body">{data.customerName}</dd>
          {data.fulfilment && (
            <>
              <dt className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>
                {data.fulfilment === "delivery" ? "Leverans / Delivery" : "Upphämtning / Pickup"}
              </dt>
              <dd className="type-body">{data.address || "–"}</dd>
            </>
          )}
        </dl>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(61,42,34,0.2)" }}>
              <th className="type-caps ink-muted" style={{ textAlign: "left", fontSize: "0.75rem", padding: "0.4rem 0" }}>
                Vara / Item
              </th>
              <th className="type-caps ink-muted" style={{ textAlign: "right", fontSize: "0.75rem", padding: "0.4rem 0" }}>
                Antal / Qty
              </th>
              <th className="type-caps ink-muted" style={{ textAlign: "right", fontSize: "0.75rem", padding: "0.4rem 0" }}>
                Summa / Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(61,42,34,0.1)" }}>
                <td className="type-body" style={{ padding: "0.4rem 0" }}>{l.name}</td>
                <td className="type-body" style={{ textAlign: "right", padding: "0.4rem 0" }}>{l.qty}</td>
                <td className="type-price" style={{ textAlign: "right", padding: "0.4rem 0" }}>{kr(l.lineTotalSek)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.25rem 1rem", maxWidth: 320, marginLeft: "auto" }}>
          <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>Delsumma / Subtotal</span>
          <span className="type-price" style={{ textAlign: "right" }}>{kr(data.subtotalSek)}</span>
          {data.deliveryFeeSek > 0 && (
            <>
              <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>Leverans / Delivery</span>
              <span className="type-price" style={{ textAlign: "right" }}>{kr(data.deliveryFeeSek)}</span>
            </>
          )}
          <span className="type-caps" style={{ fontSize: "0.875rem" }}>Totalt / Total</span>
          <span className="type-price" style={{ textAlign: "right", fontSize: "1.15rem" }}>{kr(data.totalSek)}</span>
        </div>

        <p className="type-caps ink-muted mt-6" style={{ fontSize: "0.75rem" }}>
          {data.paid
            ? "Betald med kort / Paid by card"
            : "Betalas vid upphämtning eller leverans / Paid on pickup or delivery"}
        </p>

        {!vat && (
          <p className="type-caps ink-muted mt-2" style={{ fontSize: "0.7rem", lineHeight: 1.6 }}>
            Detta är ett kvitto, inte en momsfaktura. / This is a receipt, not a VAT invoice.
          </p>
        )}
      </div>

      <div className="no-print mt-8 text-center">
        <button
          type="button"
          onClick={() => window.print()}
          className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)]"
          style={{ border: "1px solid var(--warm-cocoa)" }}
        >
          {print}
        </button>
      </div>
    </div>
  );
}
