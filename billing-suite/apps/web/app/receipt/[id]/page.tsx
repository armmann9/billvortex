"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadSalesHistory } from "../../../lib/demoData";
import {
  InvoiceReceiptData,
  STORE_INFO,
  decodeReceiptPayload,
  downloadReceiptPdf,
  numberToIndianWords,
  previewReceiptPdf,
} from "../../../lib/pdfReceipt";

export default function PublicFormalReceiptPage() {
  const params = useParams();
  const invoiceId = decodeURIComponent(String(params?.id || ""));
  const [invoice, setInvoice] = useState<InvoiceReceiptData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sp = new URLSearchParams(window.location.search);
    const encoded = sp.get("d");

    if (encoded) {
      const decoded = decodeReceiptPayload(encoded);
      if (decoded) {
        setInvoice(decoded);
        setLoaded(true);
        if (sp.get("download") === "1") {
          downloadReceiptPdf(decoded);
        }
        return;
      }
    }

    // Fallback: look up invoice in local / default sales history
    const history = loadSalesHistory();
    const match = history.find((inv) => inv.number.toLowerCase() === invoiceId.toLowerCase());
    if (match) {
      setInvoice(match);
    }
    setLoaded(true);
  }, [invoiceId]);

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#faf7f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#7a6e69",
          fontSize: 14,
        }}
      >
        Loading formal tax invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#faf7f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 460,
            background: "#ffffff",
            border: "1px solid #ebdcd0",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 12px 32px rgba(92,57,48,0.08)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#261a17", margin: "0 0 8px" }}>
            Invoice Not Found
          </h1>
          <p style={{ fontSize: 13, color: "#7a6e69", lineHeight: 1.5, margin: 0 }}>
            We could not locate invoice <strong>{invoiceId}</strong>. Please request a fresh receipt link from {STORE_INFO.name}.
          </p>
        </div>
      </div>
    );
  }

  const subtotalNum = Number(invoice.subtotal) || 0;
  const discountNum = Number(invoice.discount) || 0;
  const taxNum = Number(invoice.tax) || 0;
  const halfTax = taxNum / 2;
  const grandTotalNum = Number(invoice.grandTotal) || 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4eee6",
        padding: "24px 16px 48px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        color: "#261a17",
      }}
    >
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #ffffff !important; }
        }
      `}</style>

      {/* Top Action Bar (Hidden on Print) */}
      <div
        className="no-print"
        style={{
          maxWidth: 800,
          margin: "0 auto 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          background: "#ffffff",
          border: "1px solid #ebdcd0",
          borderRadius: 14,
          padding: "12px 18px",
          boxShadow: "0 4px 14px rgba(92, 57, 48, 0.06)",
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#261a17" }}>
            Formal Digital Tax Invoice • {invoice.number}
          </div>
          <div style={{ fontSize: 11, color: "#7a6e69" }}>
            Verified GST receipt from {STORE_INFO.name}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => downloadReceiptPdf(invoice)}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 3px 10px rgba(176, 99, 84, 0.3)",
            }}
          >
            ⬇ Download Formal PDF
          </button>

          <button
            onClick={() => previewReceiptPdf(invoice)}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #b06354",
              background: "#ffffff",
              color: "#b06354",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            👁️ Open PDF File
          </button>

          <button
            onClick={() => window.print()}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #ebdcd0",
              background: "#faf6f1",
              color: "#261a17",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Formal A4 Paper Invoice Sheet */}
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e6d8cc",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 18px 50px rgba(38, 26, 23, 0.12)",
        }}
      >
        {/* Top Terracotta Accent Band */}
        <div style={{ height: 6, background: "#b06354" }} />

        <div style={{ padding: "32px 36px" }}>
          {/* Letterhead */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 16,
              paddingBottom: 20,
              borderBottom: "1px solid #ebdcd0",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#261a17",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {STORE_INFO.name}
              </h1>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#b06354",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: 4,
                }}
              >
                {STORE_INFO.tagline}
              </div>
              <div style={{ fontSize: 12, color: "#70625c", marginTop: 8, lineHeight: 1.5 }}>
                {STORE_INFO.address}
                <br />
                GSTIN: <strong>{STORE_INFO.gstin}</strong> &nbsp;|&nbsp; Ph: {STORE_INFO.phone} &nbsp;|&nbsp; {STORE_INFO.email}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#b06354", letterSpacing: "0.04em" }}>
                TAX INVOICE
              </div>
              <div style={{ fontSize: 10, color: "#70625c", letterSpacing: "0.06em", marginTop: 2 }}>
                ORIGINAL FOR RECIPIENT
              </div>
              <div
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontWeight: 800,
                  background: "#ecfdf5",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                }}
              >
                {invoice.method === "CREDIT" ? "KHATA / CREDIT" : "PAID IN FULL"}
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div
            style={{
              marginTop: 20,
              background: "#faf6f1",
              border: "1px solid #ebdcd0",
              borderRadius: 10,
              padding: "16px 20px",
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 20,
            }}
          >
            <div style={{ borderRight: "1px solid #ebdcd0", paddingRight: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#b06354", letterSpacing: "0.08em" }}>
                BILLED TO
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#261a17", marginTop: 4 }}>
                {invoice.customerName || "Valued Customer"}
              </div>
              <div style={{ fontSize: 12, color: "#70625c", marginTop: 4 }}>
                Phone: {invoice.customerPhone || "N/A"}
              </div>
              <div style={{ fontSize: 12, color: "#70625c", marginTop: 2 }}>
                Place of Supply: {STORE_INFO.state}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#70625c" }}>Invoice No.:</span>
                <strong style={{ color: "#261a17" }}>{invoice.number}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#70625c" }}>Invoice Date:</span>
                <span>{invoice.date}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#70625c" }}>Time:</span>
                <span>{invoice.time}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#70625c" }}>Payment Mode:</span>
                <strong style={{ color: "#261a17" }}>{invoice.method}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div style={{ marginTop: 22, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#261a17", color: "#ffffff", fontSize: 11, letterSpacing: "0.05em" }}>
                  <th style={{ padding: "10px 10px", textAlign: "left" }}>#</th>
                  <th style={{ padding: "10px 10px", textAlign: "left" }}>ITEM DESCRIPTION</th>
                  <th style={{ padding: "10px 10px", textAlign: "left" }}>SKU</th>
                  <th style={{ padding: "10px 10px", textAlign: "center" }}>QTY</th>
                  <th style={{ padding: "10px 10px", textAlign: "right" }}>RATE</th>
                  <th style={{ padding: "10px 10px", textAlign: "right" }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #efe6dc",
                      background: idx % 2 === 1 ? "#fdfaf7" : "#ffffff",
                    }}
                  >
                    <td style={{ padding: "11px 10px", color: "#70625c" }}>{idx + 1}</td>
                    <td style={{ padding: "11px 10px" }}>
                      <div style={{ fontWeight: 700, color: "#261a17" }}>{it.name}</div>
                      <div style={{ fontSize: 11, color: "#70625c", marginTop: 2 }}>
                        Size: {it.size} &nbsp;|&nbsp; Color: {it.color} &nbsp;|&nbsp; Fabric: {it.fabric}
                      </div>
                    </td>
                    <td style={{ padding: "11px 10px", color: "#70625c", fontSize: 12 }}>{it.sku}</td>
                    <td style={{ padding: "11px 10px", textAlign: "center", fontWeight: 700 }}>{it.qty}</td>
                    <td style={{ padding: "11px 10px", textAlign: "right" }}>
                      ₹{Number(it.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "11px 10px", textAlign: "right", fontWeight: 700 }}>
                      ₹{it.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Amount in Words */}
          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#faf6f1",
                border: "1px solid #ebdcd0",
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: "#b06354", letterSpacing: "0.08em" }}>
                AMOUNT IN WORDS
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 14,
                  color: "#261a17",
                  marginTop: 6,
                  lineHeight: 1.45,
                }}
              >
                {numberToIndianWords(grandTotalNum)}
              </div>
              <div style={{ fontSize: 11, color: "#70625c", marginTop: 10 }}>
                Payment Mode: {invoice.method} &nbsp;|&nbsp; Status: {invoice.method === "CREDIT" ? "Posted to Khata" : "Received & Verified"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#70625c" }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{subtotalNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {discountNum > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#b91c1c", fontWeight: 700 }}>
                  <span>Discount Applied</span>
                  <span>- ₹{discountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", color: "#70625c" }}>
                <span>CGST (Central Tax)</span>
                <span>₹{halfTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#70625c" }}>
                <span>SGST (State Tax)</span>
                <span>₹{halfTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div
                style={{
                  marginTop: 6,
                  background: "#261a17",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "11px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                <span>GRAND TOTAL</span>
                <span>₹{grandTotalNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Terms & Authorised Signatory */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 18,
              borderTop: "1px solid #ebdcd0",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div style={{ maxWidth: 460 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#261a17", marginBottom: 6 }}>
                TERMS &amp; CONDITIONS
              </div>
              <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#70625c", lineHeight: 1.6 }}>
                <li>Exchange is available within 7 days of purchase with original price tag &amp; this invoice.</li>
                <li>Customised, altered, or discounted merchandise is not eligible for refund.</li>
                <li>All disputes are subject to Mumbai jurisdiction. E. &amp; O.E.</li>
              </ol>
            </div>

            <div style={{ textAlign: "right", minWidth: 180 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#261a17" }}>For {STORE_INFO.name}</div>
              <div style={{ height: 34, borderBottom: "1px solid #8a7b75", marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: "#70625c" }}>Authorised Signatory</div>
            </div>
          </div>

          <div
            style={{
              marginTop: 22,
              textAlign: "center",
              fontSize: 11,
              fontStyle: "italic",
              color: "#9a8b84",
            }}
          >
            This is a computer-generated formal tax invoice and does not require a physical signature. Thank you for shopping with us.
          </div>
        </div>
      </div>
    </div>
  );
}
