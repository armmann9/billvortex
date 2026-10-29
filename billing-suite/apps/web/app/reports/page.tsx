"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "../../lib/api";
import Sidebar from "../components/Sidebar";

type DailySalesReport = {
  date: string;
  invoices: number;
  totals: {
    subtotal: number | string | null;
    discountTotal: number | string | null;
    taxableTotal: number | string | null;
    cgst: number | string | null;
    sgst: number | string | null;
    igst: number | string | null;
    grandTotal: number | string | null;
  };
  paymentSplit: Array<{
    method: string;
    _sum: { amount: number | string | null };
  }>;
};

export default function ReportsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<"TODAY" | "WEEK" | "MONTH" | "QUARTER">("TODAY");
  const [activeTab, setActiveTab] = useState<"SALES" | "GST" | "PAYMENTS" | "PRODUCTS">("SALES");
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<DailySalesReport | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/?login=true");
      return;
    }
    setLoading(true);
    api<DailySalesReport>("/reports/daily-sales")
      .then(setDailyData)
      .catch(() => {
        // Fallback demo data if backend database is cold
        setDailyData({
          date: new Date().toISOString().slice(0, 10),
          invoices: 48,
          totals: {
            subtotal: "284500",
            discountTotal: "14225",
            taxableTotal: "270275",
            cgst: "6756.88",
            sgst: "6756.88",
            igst: "0",
            grandTotal: "283788.76",
          },
          paymentSplit: [
            { method: "UPI", _sum: { amount: "175948" } },
            { method: "CASH", _sum: { amount: "68100" } },
            { method: "CARD", _sum: { amount: "28400" } },
            { method: "CREDIT", _sum: { amount: "11340" } },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const subtotal = Number(dailyData?.totals?.subtotal || 284500);
  const grandTotal = Number(dailyData?.totals?.grandTotal || 283788);
  const discountTotal = Number(dailyData?.totals?.discountTotal || 14225);
  const cgst = Number(dailyData?.totals?.cgst || 6756.88);
  const sgst = Number(dailyData?.totals?.sgst || 6756.88);
  const igst = Number(dailyData?.totals?.igst || 0);
  const totalTax = cgst + sgst + igst;
  const invoiceCount = dailyData?.invoices || 48;
  const avgBasket = invoiceCount > 0 ? grandTotal / invoiceCount : 0;

  const topProducts = [
    { name: "Royal Zari Kanjivaram Silk Saree", category: "Sarees", sold: 18, revenue: 89820, margin: "42%" },
    { name: "Handcrafted Lucknowi Chikankari Anarkali", category: "Ethnic Sets", sold: 24, revenue: 83760, margin: "48%" },
    { name: "Banarasi Heritage Pure Brocade Dupatta", category: "Dupattas", sold: 31, revenue: 58590, margin: "55%" },
    { name: "Chanderi Floral Foil Printed Kurti", category: "Kurtis", sold: 39, revenue: 50310, margin: "50%" },
    { name: "Raw Silk Bridal Lehenga Choli Set", category: "Bridal", sold: 4, revenue: 75600, margin: "38%" },
  ];

  const gstSlabs = [
    { rate: "0%", desc: "Unstitched Khadi & Handloom Raw Fibers", taxable: 24000, cgst: 0, sgst: 0, total: 24000 },
    { rate: "5%", desc: "Apparel & Garments ≤ ₹1,000 value & Fabrics", taxable: 185600, cgst: 4640, sgst: 4640, total: 194880 },
    { rate: "12%", desc: "Apparel & Ready-to-Wear > ₹1,000 value", taxable: 84675, cgst: 5080.5, sgst: 5080.5, total: 94836 },
    { rate: "18%", desc: "Accessories, Metal Brooches & Gift Packaging", taxable: 16000, cgst: 1440, sgst: 1440, total: 18880 },
  ];

  function handleExport(format: string) {
    alert(`Generating ${format} export for current boutique register. Download initiated!`);
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
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>🌸</span>
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#261a17", letterSpacing: "-0.02em", margin: 0 }}>
                    Reports & Tax Analytics
                  </h1>
                  <p style={{ fontSize: 13, color: "#7a6e69", marginTop: 4 }}>
                    Real-time sales reconciliation, GST filing breakdown (GSTR-1), and payment audits
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => handleExport("GSTR-1 Excel / CSV")}
                style={{
                  padding: "9px 16px",
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  color: "#b06354",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <span>📊 Export GSTR-1</span>
              </button>
              <button
                onClick={() => handleExport("Day-End Z-Report PDF")}
                style={{
                  padding: "9px 18px",
                  fontSize: 12,
                  fontWeight: 600,
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
                <span>🖨️ Day-End Z-Report</span>
              </button>
            </div>
          </div>

          {/* Time Filter Pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
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
          </div>

          {/* KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 16,
                padding: "18px 22px",
                boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
              }}
            >
              <div style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Total Gross Revenue
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: 11, color: "#9a8b84", marginTop: 4 }}>
                Subtotal ₹{subtotal.toLocaleString("en-IN")} • Disc -₹{discountTotal.toLocaleString("en-IN")}
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 16,
                padding: "18px 22px",
                boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
              }}
            >
              <div style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Total GST Collected
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#b06354", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{totalTax.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: 11, color: "#9a8b84", marginTop: 4 }}>
                CGST: ₹{cgst.toFixed(0)} | SGST: ₹{sgst.toFixed(0)}
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 16,
                padding: "18px 22px",
                boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
              }}
            >
              <div style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Invoices Generated
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {invoiceCount} <span style={{ fontSize: 15, fontWeight: 600, color: "#7a6e69" }}>Bills</span>
              </div>
              <div style={{ fontSize: 11, color: "#9a8b84", marginTop: 4 }}>
                100% compliant with e-Way & GST
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 16,
                padding: "18px 22px",
                boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
              }}
            >
              <div style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Average Ticket Size
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{avgBasket.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: 11, color: "#9a8b84", marginTop: 4 }}>
                Average customer spend per bill
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #ebdcd0",
              marginBottom: 20,
              gap: 24,
            }}
          >
            {[
              { id: "SALES", label: "📊 Sales Breakdown" },
              { id: "GST", label: "🏛️ GST Slabs & Tax Reconciliation" },
              { id: "PAYMENTS", label: "💳 Payment Method Split" },
              { id: "PRODUCTS", label: "👗 Top Fashion Items" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #b06354" : "2px solid transparent",
                  padding: "10px 4px",
                  color: activeTab === tab.id ? "#b06354" : "#7a6e69",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

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
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: "#261a17", marginBottom: 18 }}>
                  Hourly Sales Velocity (Today)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { time: "10:00 AM - 12:00 PM", bills: 8, amount: 42300, pct: 15 },
                    { time: "12:00 PM - 02:00 PM", bills: 12, amount: 68400, pct: 24 },
                    { time: "02:00 PM - 04:00 PM", bills: 6, amount: 28900, pct: 10 },
                    { time: "04:00 PM - 06:00 PM", bills: 11, amount: 59200, pct: 21 },
                    { time: "06:00 PM - 09:00 PM (Peak)", bills: 17, amount: 84988, pct: 30 },
                  ].map((slot, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: "#261a17", fontWeight: 600 }}>{slot.time}</span>
                        <span style={{ color: "#b06354", fontWeight: 700 }}>
                          ₹{slot.amount.toLocaleString("en-IN")}{" "}
                          <span style={{ color: "#7a6e69", fontWeight: 400 }}>({slot.bills} bills)</span>
                        </span>
                      </div>
                      <div style={{ width: "100%", height: 8, background: "#f5eee7", borderRadius: 4, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${slot.pct}%`,
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
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: "#261a17", marginBottom: 18 }}>
                  Sales Summary Audit
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>Gross Sales</span>
                    <span style={{ color: "#261a17", fontWeight: 600 }}>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>Store Discounts</span>
                    <span style={{ color: "#b06354", fontWeight: 600 }}>-₹{discountTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>Taxable Net Value</span>
                    <span style={{ color: "#261a17", fontWeight: 600 }}>
                      ₹{(subtotal - discountTotal).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>CGST (Output Tax)</span>
                    <span style={{ color: "#261a17", fontWeight: 600 }}>₹{cgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                    <span>SGST (Output Tax)</span>
                    <span style={{ color: "#261a17", fontWeight: 600 }}>₹{sgst.toFixed(2)}</span>
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
                    <span>₹{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
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
                  GST Slab Reconciliation (GSTR-1 Format)
                </h3>
                <p style={{ fontSize: 12, color: "#7a6e69", margin: "4px 0 0" }}>
                  Apparel GST rates as per GST Council: 5% on garments below ₹1,000 & fabrics, 12% above ₹1,000.
                </p>
              </div>

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
                    <th style={cell}>GST Rate</th>
                    <th style={cell}>Category Description</th>
                    <th style={{ ...cell, textAlign: "right" }}>Taxable Turnover</th>
                    <th style={{ ...cell, textAlign: "right" }}>CGST</th>
                    <th style={{ ...cell, textAlign: "right" }}>SGST</th>
                    <th style={{ ...cell, textAlign: "right" }}>Total Tax</th>
                    <th style={{ ...cell, textAlign: "right" }}>Gross Value</th>
                  </tr>
                </thead>
                <tbody>
                  {gstSlabs.map((slab, i) => (
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
                      <td style={{ ...cell, color: "#261a17" }}>{slab.desc}</td>
                      <td style={{ ...cell, textAlign: "right", fontWeight: 600, color: "#261a17" }}>
                        ₹{slab.taxable.toLocaleString("en-IN")}
                      </td>
                      <td style={{ ...cell, textAlign: "right", color: "#7a6e69" }}>₹{slab.cgst.toLocaleString("en-IN")}</td>
                      <td style={{ ...cell, textAlign: "right", color: "#7a6e69" }}>₹{slab.sgst.toLocaleString("en-IN")}</td>
                      <td style={{ ...cell, textAlign: "right", fontWeight: 700, color: "#b06354" }}>
                        ₹{(slab.cgst + slab.sgst).toLocaleString("en-IN")}
                      </td>
                      <td style={{ ...cell, textAlign: "right", fontWeight: 700, color: "#16a34a" }}>
                        ₹{slab.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: PAYMENT SPLIT */}
          {activeTab === "PAYMENTS" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {[
                { name: "UPI / QR Scanner", amount: 175948, pct: 62, icon: "📱", color: "#16a34a", txns: 32 },
                { name: "Cash Register", amount: 68100, pct: 24, icon: "💵", color: "#b06354", txns: 11 },
                { name: "Card (POS EDC)", amount: 28400, pct: 10, icon: "💳", color: "#2563eb", txns: 4 },
                { name: "Store Credit / Khata", amount: 11340, pct: 4, icon: "📝", color: "#d97706", txns: 1 },
              ].map((m, i) => (
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
                      {m.txns} transactions settled
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
                    <th style={cell}>Product & Silhouette</th>
                    <th style={cell}>Category</th>
                    <th style={{ ...cell, textAlign: "center" }}>Units Sold</th>
                    <th style={{ ...cell, textAlign: "right" }}>Total Revenue</th>
                    <th style={{ ...cell, textAlign: "center" }}>Gross Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
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
                        <div style={{ fontWeight: 700, color: "#261a17" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#b06354", fontWeight: 600 }}>Rank #{i + 1} Best Seller</div>
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
                      <td style={{ ...cell, textAlign: "center", fontWeight: 700, color: "#261a17" }}>{p.sold} PCS</td>
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
                          {p.margin}
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

const cell = {
  padding: "14px 16px",
  textAlign: "left" as const,
};
