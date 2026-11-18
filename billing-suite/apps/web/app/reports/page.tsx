"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../lib/api";
import {
  ExtendedInvoiceRecord,
  ReportPeriod,
  computePeriodAnalytics,
  loadSalesHistory,
} from "../../lib/demoData";
import {
  downloadReceiptPdf,
  downloadZReportPdf,
  previewReceiptPdf,
  sendPdfReceiptViaWhatsApp,
} from "../../lib/pdfReceipt";
import Sidebar from "../components/Sidebar";

type ReportTab = "HISTORY" | "SALES" | "GST" | "PAYMENTS" | "PRODUCTS";

export default function ReportsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<ReportPeriod>("TODAY");
  const [activeTab, setActiveTab] = useState<ReportTab>("SALES");
  const [salesHistory, setSalesHistory] = useState<ExtendedInvoiceRecord[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyMethod, setHistoryMethod] = useState<string>("ALL");
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/?login=true");
      return;
    }

    setSalesHistory(loadSalesHistory());

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toUpperCase();
      if (
        tabParam === "HISTORY" ||
        tabParam === "SALES" ||
        tabParam === "GST" ||
        tabParam === "PAYMENTS" ||
        tabParam === "PRODUCTS"
      ) {
        setActiveTab(tabParam);
      }
    }
  }, [router]);

  const analytics = useMemo(
    () => computePeriodAnalytics(period, salesHistory),
    [period, salesHistory]
  );

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return salesHistory.filter((inv) => {
      const matchMethod = historyMethod === "ALL" || inv.method === historyMethod;
      if (!matchMethod) return false;
      if (!q) return true;
      return (
        inv.number.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerPhone.toLowerCase().includes(q) ||
        (inv.branch || "").toLowerCase().includes(q) ||
        inv.items.some((it) => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
      );
    });
  }, [salesHistory, historySearch, historyMethod]);

  function showToast(text: string) {
    setToastMsg(text);
    setTimeout(() => setToastMsg(""), 4000);
  }

  function handleExportGstr1Csv() {
    const header =
      "Invoice Number,Date,Time,Branch,Customer Name,Phone,Payment Mode,Subtotal,Discount,Taxable Value,CGST,SGST,Total GST,Grand Total\n";
    const rows = salesHistory
      .map((inv) => {
        const sub = Number(inv.subtotal) || 0;
        const disc = Number(inv.discount) || 0;
        const taxable = Math.max(0, sub - disc);
        const tax = Number(inv.tax) || 0;
        const halfTax = (tax / 2).toFixed(2);
        return `"${inv.number}","${inv.date}","${inv.time}","${inv.branch || "Bandra Flagship"}","${inv.customerName}","${inv.customerPhone}","${inv.method}","${sub.toFixed(2)}","${disc.toFixed(2)}","${taxable.toFixed(2)}","${halfTax}","${halfTax}","${tax.toFixed(2)}","${inv.grandTotal}"`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BillVortex_GSTR1_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`GSTR-1 CSV downloaded (${salesHistory.length} compliant invoices).`);
  }

  function handleDownloadZReport() {
    const fileName = downloadZReportPdf({
      periodLabel: analytics.label,
      invoiceCount: analytics.invoiceCount,
      subtotal: analytics.subtotal,
      discountTotal: analytics.discountTotal,
      taxableTotal: analytics.taxableTotal,
      cgst: analytics.cgst,
      sgst: analytics.sgst,
      totalTax: analytics.totalTax,
      grandTotal: analytics.grandTotal,
      paymentSplit: analytics.paymentSplit,
      gstSlabs: analytics.gstSlabs,
    });
    showToast(`Formal Z-Report PDF saved as "${fileName}".`);
  }

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", background: "#faf7f2", color: "#261a17", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <main style={{ flex: 1, padding: "24px 32px", maxWidth: 1440, margin: "0 auto", width: "100%" }}>
          {/* Header Title */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>🏛️</span>
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#261a17", letterSpacing: "-0.02em", margin: 0 }}>
                    Billing History, GST &amp; Sales Analytics
                  </h1>
                  <p style={{ fontSize: 13, color: "#7a6e69", marginTop: 4 }}>
                    Live invoice ledger, GSTR-1 slab reconciliation, payment tender audits &amp; margin analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={handleExportGstr1Csv}
                style={{
                  padding: "9px 16px",
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  color: "#b06354",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <span>📥 Export GSTR-1 CSV</span>
              </button>
              <button
                onClick={handleDownloadZReport}
                style={{
                  padding: "9px 18px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                  border: "none",
                  borderRadius: 20,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(176, 99, 84, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>📄 Download Z-Report PDF</span>
              </button>
            </div>
          </div>

          {toastMsg && (
            <div
              style={{
                padding: "10px 14px",
                marginBottom: 16,
                borderRadius: 10,
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              ✓ {toastMsg}
            </div>
          )}

          {/* Time Filter Pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            {(["TODAY", "WEEK", "MONTH", "QUARTER"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: period === p ? "#b06354" : "#ffffff",
                  color: period === p ? "#ffffff" : "#7a6e69",
                  border: period === p ? "1px solid #b06354" : "1px solid #ebdcd0",
                  transition: "all 0.15s ease",
                }}
              >
                {p === "TODAY" ? "Today's Register" : p === "WEEK" ? "Last 7 Days" : p === "MONTH" ? "This Month" : "Current FY Q3"}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#8a7b75", fontWeight: 600 }}>
              Showing consolidated data across 3 branches • GSTIN: 27AABCA1234F1Z5
            </span>
          </div>

          {/* KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div style={kpiCard}>
              <div style={kpiLabel}>Net Register Revenue</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{analytics.grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: 11, color: "#9a8b84", marginTop: 4 }}>
                Taxable ₹{analytics.taxableTotal.toLocaleString("en-IN")} • Disc -₹{analytics.discountTotal.toLocaleString("en-IN")}
              </div>
            </div>

            <div style={kpiCard}>
              <div style={kpiLabel}>Total GST Collected</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#b06354", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{analytics.totalTax.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: 11, color: "#9a8b84", marginTop: 4 }}>
                CGST ₹{analytics.cgst.toLocaleString("en-IN", { maximumFractionDigits: 0 })} | SGST ₹{analytics.sgst.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div style={kpiCard}>
              <div style={kpiLabel}>Invoices Issued</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {analytics.invoiceCount} <span style={{ fontSize: 15, fontWeight: 600, color: "#7a6e69" }}>Bills</span>
              </div>
              <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4, fontWeight: 600 }}>
                100% GST &amp; PDF receipt reconciled
              </div>
            </div>

            <div style={kpiCard}>
              <div style={kpiLabel}>Average Bill Value</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{analytics.avgBasket.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: 11, color: "#9a8b84", marginTop: 4 }}>
                Est. Gross Margin: ~48.4%
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #ebdcd0",
              marginBottom: 20,
              gap: 22,
              overflowX: "auto",
            }}
          >
            {[
              { id: "HISTORY", label: `📋 Billing History (${salesHistory.length})` },
              { id: "SALES", label: "📊 Sales & Velocity Analysis" },
              { id: "GST", label: "🏛️ GST Slabs & GSTR-1" },
              { id: "PAYMENTS", label: "💳 Payment Method Split" },
              { id: "PRODUCTS", label: "👗 Top Selling Items" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #b06354" : "2px solid transparent",
                  padding: "10px 4px",
                  color: activeTab === tab.id ? "#b06354" : "#7a6e69",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 13.5,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 0: BILLING HISTORY */}
          {activeTab === "HISTORY" && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
              }}
            >
              {/* Search & Payment Mode Filter */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #ebdcd0",
                  background: "#fcf9f5",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ position: "relative", minWidth: 260, flex: 1, maxWidth: 420 }}>
                  <input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search invoice no., customer, phone, branch, or item..."
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 34px",
                      borderRadius: 8,
                      border: "1px solid #ebdcd0",
                      background: "#ffffff",
                      fontSize: 12.5,
                      color: "#261a17",
                      outline: "none",
                    }}
                  />
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>
                    🔍
                  </span>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["ALL", "UPI", "CARD", "CASH", "CREDIT"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setHistoryMethod(m)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 16,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: historyMethod === m ? "1px solid #b06354" : "1px solid #ebdcd0",
                        background: historyMethod === m ? "#b06354" : "#ffffff",
                        color: historyMethod === m ? "#ffffff" : "#7a6e69",
                      }}
                    >
                      {m === "ALL" ? "All Modes" : m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr
                      style={{
                        background: "#faf6f1",
                        borderBottom: "1px solid #ebdcd0",
                        color: "#7a6e69",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      <th style={cell}>Invoice &amp; Branch</th>
                      <th style={cell}>Customer</th>
                      <th style={cell}>Items Purchased</th>
                      <th style={cell}>Payment</th>
                      <th style={{ ...cell, textAlign: "right" }}>GST</th>
                      <th style={{ ...cell, textAlign: "right" }}>Grand Total</th>
                      <th style={{ ...cell, textAlign: "right" }}>Formal PDF Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((inv, idx) => (
                      <tr
                        key={inv.number + idx}
                        style={{
                          borderBottom: "1px solid #f3ece4",
                          background: idx % 2 === 0 ? "#ffffff" : "#fdfaf7",
                        }}
                      >
                        <td style={cell}>
                          <div style={{ fontWeight: 700, color: "#261a17" }}>{inv.number}</div>
                          <div style={{ fontSize: 11, color: "#8a7b75", marginTop: 2 }}>
                            {inv.date} • {inv.time}
                          </div>
                          <div style={{ fontSize: 10, color: "#b06354", fontWeight: 600, marginTop: 2 }}>
                            📍 {inv.branch || "Bandra Flagship"}
                          </div>
                        </td>

                        <td style={cell}>
                          <div style={{ fontWeight: 600, color: "#261a17" }}>{inv.customerName}</div>
                          <div style={{ fontSize: 11, color: "#8a7b75" }}>{inv.customerPhone}</div>
                        </td>

                        <td style={cell}>
                          <div style={{ fontWeight: 600, color: "#261a17", fontSize: 12 }}>
                            {inv.items[0]?.name || "Apparel Sale"}
                            {inv.items.length > 1 ? ` +${inv.items.length - 1} more` : ""}
                          </div>
                          <div style={{ fontSize: 11, color: "#8a7b75" }}>
                            {inv.items.reduce((s, it) => s + (Number(it.qty) || 1), 0)} units
                            {Number(inv.discount) > 0 ? ` • Disc -₹${Number(inv.discount).toFixed(0)}` : ""}
                          </div>
                        </td>

                        <td style={cell}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 10.5,
                              fontWeight: 700,
                              background:
                                inv.method === "UPI"
                                  ? "#ecfdf5"
                                  : inv.method === "CARD"
                                  ? "#eff6ff"
                                  : inv.method === "CASH"
                                  ? "#fbf3ef"
                                  : "#fef3c7",
                              color:
                                inv.method === "UPI"
                                  ? "#047857"
                                  : inv.method === "CARD"
                                  ? "#1d4ed8"
                                  : inv.method === "CASH"
                                  ? "#b06354"
                                  : "#b45309",
                            }}
                          >
                            {inv.method}
                          </span>
                        </td>

                        <td style={{ ...cell, textAlign: "right", color: "#7a6e69", fontSize: 12 }}>
                          ₹{Number(inv.tax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        <td style={{ ...cell, textAlign: "right", fontWeight: 800, color: "#261a17", fontSize: 14 }}>
                          ₹{Number(inv.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        <td style={{ ...cell, textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              onClick={() => previewReceiptPdf(inv)}
                              title="Preview Formal PDF Receipt"
                              style={{
                                padding: "5px 9px",
                                borderRadius: 6,
                                border: "1px solid #ebdcd0",
                                background: "#faf6f1",
                                color: "#261a17",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              👁️ PDF
                            </button>
                            <button
                              onClick={() => {
                                const fn = downloadReceiptPdf(inv);
                                showToast(`Downloaded formal receipt "${fn}".`);
                              }}
                              title="Download PDF"
                              style={{
                                padding: "5px 9px",
                                borderRadius: 6,
                                border: "1px solid #b06354",
                                background: "#ffffff",
                                color: "#b06354",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ⬇
                            </button>
                            <button
                              onClick={() => {
                                sendPdfReceiptViaWhatsApp(inv);
                                showToast(`Formal PDF receipt link opened in WhatsApp for ${inv.customerName}.`);
                              }}
                              title="Send 1-Click Formal PDF Receipt Link on WhatsApp"
                              style={{
                                padding: "5px 9px",
                                borderRadius: 6,
                                border: "none",
                                background: "#25D366",
                                color: "#ffffff",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              💬 Send PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 1: SALES BREAKDOWN */}
          {activeTab === "SALES" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: "#261a17", marginBottom: 18, marginTop: 0 }}>
                  {analytics.velocityTitle}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  {analytics.velocitySlots.map((slot, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: "#261a17", fontWeight: 600 }}>{slot.label}</span>
                        <span style={{ color: "#b06354", fontWeight: 700 }}>
                          ₹{slot.amount.toLocaleString("en-IN")}{" "}
                          <span style={{ color: "#7a6e69", fontWeight: 400 }}>({slot.bills} bills)</span>
                        </span>
                      </div>
                      <div style={{ width: "100%", height: 8, background: "#f5eee7", borderRadius: 4, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(100, slot.pct * 2.2)}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #b06354, #d48b7b)",
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: "#261a17", marginBottom: 18, marginTop: 0 }}>
                  Sales Summary Audit ({analytics.label})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 13, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>Gross Merchandise Value</span>
                    <span style={{ color: "#261a17", fontWeight: 600 }}>₹{analytics.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>Store Discounts Applied</span>
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>-₹{analytics.discountTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>Net Taxable Turnover</span>
                    <span style={{ color: "#261a17", fontWeight: 600 }}>
                      ₹{analytics.taxableTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>CGST (Central Output Tax)</span>
                    <span style={{ color: "#261a17", fontWeight: 600 }}>₹{analytics.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>SGST (State Output Tax)</span>
                    <span style={{ color: "#261a17", fontWeight: 600 }}>₹{analytics.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid #ebdcd0",
                      paddingTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#b06354",
                    }}
                  >
                    <span>Net Register Total</span>
                    <span>₹{analytics.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GST SLABS */}
          {activeTab === "GST" && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
              }}
            >
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #ebdcd0", background: "#fcf9f5" }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: "#261a17", margin: 0 }}>
                  GST Slab Reconciliation — {analytics.label} (GSTR-1 Format)
                </h3>
                <p style={{ fontSize: 12, color: "#7a6e69", margin: "4px 0 0" }}>
                  Reconciled HSN/Slab breakdown: 5% on apparel ≤ ₹1,000 &amp; fabrics, 12% on apparel &gt; ₹1,000, 18% on accessories.
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr
                      style={{
                        background: "#fcf9f5",
                        borderBottom: "1px solid #ebdcd0",
                        color: "#7a6e69",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      <th style={cell}>GST Slab</th>
                      <th style={cell}>HSN Group</th>
                      <th style={cell}>Category Description</th>
                      <th style={{ ...cell, textAlign: "right" }}>Taxable Turnover</th>
                      <th style={{ ...cell, textAlign: "right" }}>CGST</th>
                      <th style={{ ...cell, textAlign: "right" }}>SGST</th>
                      <th style={{ ...cell, textAlign: "right" }}>Total GST</th>
                      <th style={{ ...cell, textAlign: "right" }}>Gross Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.gstSlabs.map((slab, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid #f3ece4",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ee")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={cell}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "#fbf3ef",
                              color: "#b06354",
                              fontWeight: 700,
                              border: "1px solid #ebdcd0",
                            }}
                          >
                            {slab.rate}
                          </span>
                        </td>
                        <td style={{ ...cell, fontFamily: "monospace", fontSize: 11.5, color: "#7a6e69" }}>
                          {slab.hsn}
                        </td>
                        <td style={{ ...cell, color: "#261a17" }}>{slab.desc}</td>
                        <td style={{ ...cell, textAlign: "right", fontWeight: 600, color: "#261a17" }}>
                          ₹{slab.taxable.toLocaleString("en-IN")}
                        </td>
                        <td style={{ ...cell, textAlign: "right", color: "#7a6e69" }}>
                          ₹{slab.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ ...cell, textAlign: "right", color: "#7a6e69" }}>
                          ₹{slab.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ ...cell, textAlign: "right", fontWeight: 700, color: "#b06354" }}>
                          ₹{(slab.cgst + slab.sgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ ...cell, textAlign: "right", fontWeight: 700, color: "#16a34a" }}>
                          ₹{slab.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: "#faf5ee", borderTop: "2px solid #ebdcd0", fontWeight: 800 }}>
                      <td style={cell} colSpan={3}>RECONCILED TOTAL ({analytics.label.toUpperCase()})</td>
                      <td style={{ ...cell, textAlign: "right", color: "#261a17" }}>
                        ₹{analytics.taxableTotal.toLocaleString("en-IN")}
                      </td>
                      <td style={{ ...cell, textAlign: "right", color: "#261a17" }}>
                        ₹{analytics.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ ...cell, textAlign: "right", color: "#261a17" }}>
                        ₹{analytics.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ ...cell, textAlign: "right", color: "#b06354" }}>
                        ₹{analytics.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ ...cell, textAlign: "right", color: "#16a34a" }}>
                        ₹{analytics.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT SPLIT */}
          {activeTab === "PAYMENTS" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {analytics.paymentSplit.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #ebdcd0",
                    borderRadius: 16,
                    padding: 22,
                    boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 24 }}>{m.icon}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 12,
                        background: "#fbf3ef",
                        color: "#b06354",
                        border: "1px solid #ebdcd0",
                      }}
                    >
                      {m.pct}% share
                    </span>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 13, color: "#7a6e69", fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#261a17", marginTop: 4, fontFamily: "'Playfair Display', Georgia, serif" }}>
                      ₹{m.amount.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 11, color: "#9a8b84", marginTop: 4 }}>
                      {m.txns} settled invoices • {analytics.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: TOP PRODUCTS */}
          {activeTab === "PRODUCTS" && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr
                    style={{
                      background: "#fcf9f5",
                      borderBottom: "1px solid #ebdcd0",
                      color: "#7a6e69",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <th style={cell}>Product &amp; SKU</th>
                    <th style={cell}>Category</th>
                    <th style={{ ...cell, textAlign: "center" }}>Units Sold</th>
                    <th style={{ ...cell, textAlign: "right" }}>Total Revenue</th>
                    <th style={{ ...cell, textAlign: "center" }}>Gross Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topProducts.map((p, i) => (
                    <tr
                      key={p.sku}
                      style={{
                        borderBottom: "1px solid #f3ece4",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ee")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={cell}>
                        <div style={{ fontWeight: 700, color: "#261a17" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#b06354", fontWeight: 600 }}>
                          Rank #{i + 1} • SKU {p.sku}
                        </div>
                      </td>
                      <td style={cell}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "#fbf3ef",
                            color: "#b06354",
                            fontSize: 11,
                            fontWeight: 600,
                            border: "1px solid #ebdcd0",
                          }}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td style={{ ...cell, textAlign: "center", fontWeight: 700, color: "#261a17" }}>
                        {p.sold} PCS
                      </td>
                      <td style={{ ...cell, textAlign: "right", fontWeight: 700, color: "#b06354", fontSize: 14 }}>
                        ₹{p.revenue.toLocaleString("en-IN")}
                      </td>
                      <td style={{ ...cell, textAlign: "center" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 12,
                            background: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {p.marginPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const kpiCard = {
  background: "#ffffff",
  border: "1px solid #ebdcd0",
  borderRadius: 16,
  padding: "18px 22px",
  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
};

const kpiLabel = {
  fontSize: 12,
  color: "#7a6e69",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const cell = {
  padding: "14px 16px",
  textAlign: "left" as const,
};
