"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "../../lib/api";
import { SAMPLE_FASHION_PRODUCTS, FashionProductItem } from "../../lib/fashionCatalog";
import {
  ExtendedInvoiceRecord,
  loadInventoryItems,
  loadSalesHistory,
} from "../../lib/demoData";
import {
  previewReceiptPdf,
  sendPdfReceiptViaWhatsApp,
} from "../../lib/pdfReceipt";
import Sidebar from "../components/Sidebar";

type InvoiceRecord = ExtendedInvoiceRecord;

export default function DashboardPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<FashionProductItem[]>(SAMPLE_FASHION_PRODUCTS);
  const [salesHistory, setSalesHistory] = useState<InvoiceRecord[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  useEffect(() => {
    if (!getToken()) {
      router.push("/?login=true");
      return;
    }

    setCatalog(loadInventoryItems());
    setSalesHistory(loadSalesHistory());
  }, [router]);

  const branchFilteredSales = useMemo(() => {
    if (selectedBranch === "ALL") return salesHistory;
    return salesHistory.filter((inv) => (inv.branch || "Bandra Flagship") === selectedBranch);
  }, [salesHistory, selectedBranch]);

  const todaySalesList = useMemo(
    () => branchFilteredSales.filter((inv) => (inv.daysAgo ?? 0) === 0),
    [branchFilteredSales]
  );

  const { totalUnitsInStock, lowStockCount } = useMemo(() => {
    let units = 0;
    const low: FashionProductItem[] = [];

    catalog.forEach((item) => {
      units += item.stock;
      if (item.stock <= item.lowStockThreshold) {
        low.push(item);
      }
    });

    return {
      totalUnitsInStock: units,
      lowStockCount: low.length,
    };
  }, [catalog]);

  const { todaySalesTotal, todayOrdersCount, avgTicketSize } = useMemo(() => {
    const source = todaySalesList.length > 0 ? todaySalesList : branchFilteredSales;
    let total = 0;
    source.forEach((inv) => {
      total += Number(inv.grandTotal) || 0;
    });

    const count = source.length;
    const avg = count > 0 ? total / count : 0;

    return {
      todaySalesTotal: total,
      todayOrdersCount: count,
      avgTicketSize: avg,
    };
  }, [todaySalesList, branchFilteredSales]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; stock: number; color: string }>();
    const colors = ["#b06354", "#d97706", "#2563eb", "#16a34a", "#8b5cf6", "#ec4899"];

    catalog.forEach((it) => {
      const cat = it.category;
      const current = map.get(cat) || { count: 0, stock: 0, color: colors[map.size % colors.length] };
      current.count += 1;
      current.stock += it.stock;
      map.set(cat, current);
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      ...data,
      pct: totalUnitsInStock > 0 ? Math.round((data.stock / totalUnitsInStock) * 100) : 0,
    }));
  }, [catalog, totalUnitsInStock]);

  function exportGstr1Csv() {
    const headers = "Invoice Number,Date,Customer,Payment Mode,Taxable Value,Estimated GST,Grand Total\n";
    const rows = salesHistory
      .map(
        (inv) =>
          `"${inv.number}","${inv.date}","${inv.customerName}","${inv.method}","${inv.subtotal}","${inv.tax}","${inv.grandTotal}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GSTR1_LiveSales_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resendWhatsApp(inv: InvoiceRecord) {
    sendPdfReceiptViaWhatsApp(inv);
  }

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", background: "#faf7f2", color: "#261a17", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <main style={{ flex: 1, padding: "24px 32px", maxWidth: 1440, margin: "0 auto", width: "100%" }}>
          {/* Header Banner */}
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
                    Store Live Overview
                  </h1>
                  <p style={{ fontSize: 13, color: "#7a6e69", marginTop: 4 }}>
                    Real-time sales velocity, apparel inventory, and customer invoices
                  </p>
                </div>
              </div>
            </div>

            {/* Header Actions + Multi-Branch Switcher */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                aria-label="Select Store Branch"
                style={{
                  padding: "8px 14px",
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  color: "#261a17",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="ALL">🏪 All Branches (3 Outlets)</option>
                <option value="Bandra Flagship">📍 Bandra Flagship</option>
                <option value="Andheri Studio">📍 Andheri Studio</option>
                <option value="Thane Retail Hub">📍 Thane Retail Hub</option>
              </select>

              <button
                onClick={exportGstr1Csv}
                style={{
                  padding: "8px 16px",
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  color: "#6e5d57",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <span>📥 Export GSTR-1 CSV</span>
              </button>

              <Link
                href="/pos"
                style={{
                  background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                  color: "#fff",
                  padding: "9px 20px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(176, 99, 84, 0.35)",
                }}
              >
                <span>⚡ Open Quick Bill</span>
              </Link>
            </div>
          </div>

          {/* 4 BOUTIQUE METRIC CARDS (Exact style from screenshot) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Card 1: Today's Sales */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: "0 2px 10px rgba(92, 57, 48, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, color: "#7a6e69", fontWeight: 600 }}>Today&apos;s Gross Sales</span>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fbf3ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#b06354", fontWeight: 800 }}>
                  ₹
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#261a17", marginTop: 8, letterSpacing: "-0.02em" }}>
                ₹{todaySalesTotal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4, fontWeight: 600 }}>
                ↑ {todayOrdersCount} bills generated today
              </div>
            </div>

            {/* Card 2: Items in Stock */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: "0 2px 10px rgba(92, 57, 48, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, color: "#7a6e69", fontWeight: 600 }}>Total Items in Stock</span>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fbf3ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#b06354", fontSize: 14 }}>
                  📦
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#261a17", marginTop: 8, letterSpacing: "-0.02em" }}>
                {totalUnitsInStock.toLocaleString("en-IN")} PCS
              </div>
              <div style={{ fontSize: 12, color: "#7a6e69", marginTop: 4 }}>
                Across {catalog.length} apparel styles in catalog
              </div>
            </div>

            {/* Card 3: Total Orders */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: "0 2px 10px rgba(92, 57, 48, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, color: "#7a6e69", fontWeight: 600 }}>Total Orders</span>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fbf3ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#b06354", fontSize: 14 }}>
                  🧾
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#261a17", marginTop: 8, letterSpacing: "-0.02em" }}>
                {todayOrdersCount} Bills
              </div>
              <div style={{ fontSize: 12, color: "#7a6e69", marginTop: 4 }}>
                Avg ticket: ₹{avgTicketSize.toFixed(0)} per bill
              </div>
            </div>

            {/* Card 4: Low Stock Alerts */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: "0 2px 10px rgba(92, 57, 48, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, color: "#7a6e69", fontWeight: 600 }}>Low Stock Alerts</span>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff6ea", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", fontSize: 14 }}>
                  ⚠️
                </div>
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: lowStockCount > 0 ? "#b06354" : "#16a34a",
                  marginTop: 8,
                  letterSpacing: "-0.02em",
                }}
              >
                {lowStockCount} Variants
              </div>
              <div style={{ fontSize: 12, color: lowStockCount > 0 ? "#b45309" : "#16a34a", marginTop: 4, fontWeight: 600 }}>
                {lowStockCount > 0 ? "Restocking needed" : "All variants well stocked"}
              </div>
            </div>
          </div>

          {/* TWO COLUMN WORKSPACE: RECENT LIVE BILLS + CATEGORY INVENTORY */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* LEFT: Recent Live Transactions */}
            <div style={{ background: "#ffffff", border: "1px solid #ebdcd0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1eae2",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fdfaf7",
                }}
              >
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#261a17", margin: 0 }}>
                    Recent Billing Transactions
                  </h3>
                  <div style={{ fontSize: 12, color: "#7a6e69", marginTop: 2 }}>
                    Real invoices created at POS counter with WhatsApp receipts
                  </div>
                </div>

                <Link
                  href="/reports?tab=HISTORY"
                  style={{ fontSize: 12, color: "#b06354", textDecoration: "none", fontWeight: 700 }}
                >
                  Full Billing History &rarr;
                </Link>
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
                      }}
                    >
                      <th style={cell}>Bill No.</th>
                      <th style={cell}>Customer</th>
                      <th style={cell}>Mode</th>
                      <th style={{ ...cell, textAlign: "right" }}>Amount</th>
                      <th style={{ ...cell, textAlign: "center" }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchFilteredSales.slice(0, 7).map((inv, idx) => (
                      <tr
                        key={inv.number + idx}
                        style={{
                          borderBottom: "1px solid #f4eee6",
                          background: idx % 2 === 0 ? "#ffffff" : "#fdfaf7",
                        }}
                      >
                        <td style={cell}>
                          <div style={{ fontWeight: 700, color: "#261a17" }}>{inv.number}</div>
                          <div style={{ fontSize: 11, color: "#8b7c76" }}>
                            {inv.date} • {inv.time}
                          </div>
                        </td>

                        <td style={cell}>
                          <div style={{ color: "#261a17", fontWeight: 600 }}>{inv.customerName}</div>
                          <div style={{ fontSize: 11, color: "#8b7c76" }}>{inv.customerPhone}</div>
                        </td>

                        <td style={cell}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              background:
                                inv.method === "UPI"
                                  ? "#eff6ff"
                                  : inv.method === "CASH"
                                  ? "#ecfdf5"
                                  : "#fffbeb",
                              color:
                                inv.method === "UPI"
                                  ? "#2563eb"
                                  : inv.method === "CASH"
                                  ? "#16a34a"
                                  : "#d97706",
                              border:
                                inv.method === "UPI"
                                  ? "1px solid #bfdbfe"
                                  : inv.method === "CASH"
                                  ? "1px solid #a7f3d0"
                                  : "1px solid #fde68a",
                            }}
                          >
                            {inv.method}
                          </span>
                        </td>

                        <td style={{ ...cell, textAlign: "right", fontWeight: 800, color: "#261a17", fontSize: 14 }}>
                          ₹{Number(inv.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        <td style={{ ...cell, textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                            <button
                              onClick={() => previewReceiptPdf(inv)}
                              title="View / Download Formal PDF Receipt"
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid #ebdcd0",
                                background: "#faf6f1",
                                color: "#261a17",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              📄 PDF
                            </button>
                            <button
                              onClick={() => resendWhatsApp(inv)}
                              title="Download Formal PDF Receipt & Send on WhatsApp"
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "none",
                                background: "#25D366",
                                color: "#fff",
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

            {/* RIGHT: Live Category Stock Distribution */}
            <div style={{ background: "#ffffff", border: "1px solid #ebdcd0", borderRadius: 14, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#261a17", margin: 0, marginBottom: 4 }}>
                Apparel Stock by Category
              </h3>
              <p style={{ fontSize: 12, color: "#7a6e69", marginBottom: 16 }}>
                Live inventory balance across departments
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {categoryStats.map((c) => (
                  <div key={c.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#261a17", fontWeight: 600 }}>{c.name}</span>
                      <span style={{ color: "#b06354", fontWeight: 700 }}>
                        {c.stock} PCS <span style={{ color: "#8b7c76", fontWeight: 400 }}>({c.pct}%)</span>
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "#f1eae2", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${c.pct}%`,
                          height: "100%",
                          background: c.color,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Links */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1eae2", display: "flex", gap: 8 }}>
                <Link
                  href="/inventory"
                  style={{
                    flex: 1,
                    padding: "8px",
                    textAlign: "center",
                    borderRadius: 6,
                    background: "#fbf6f0",
                    color: "#b06354",
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: "none",
                    border: "1px solid #ebdcd0",
                  }}
                >
                  Manage Stock &rarr;
                </Link>
                <Link
                  href="/customers"
                  style={{
                    flex: 1,
                    padding: "8px",
                    textAlign: "center",
                    borderRadius: 6,
                    background: "#fbf6f0",
                    color: "#b06354",
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: "none",
                    border: "1px solid #ebdcd0",
                  }}
                >
                  Customer Khata &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* FEATURED APPAREL STYLES */}
          <div style={{ background: "#ffffff", border: "1px solid #ebdcd0", borderRadius: 14, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#261a17", margin: 0 }}>
                  Featured Apparel Catalog &amp; Stock Health
                </h3>
                <div style={{ fontSize: 12, color: "#7a6e69", marginTop: 2 }}>
                  Live catalog items ready for immediate billing at checkout counter
                </div>
              </div>
              <Link
                href="/inventory"
                style={{ fontSize: 12, color: "#b06354", textDecoration: "none", fontWeight: 700 }}
              >
                Catalog Master &rarr;
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {catalog.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#fdfaf7",
                    border: "1px solid #ebdcd0",
                    borderRadius: 10,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ height: 110, position: "relative", background: "#f0e6dc" }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        👗
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 700,
                        background: item.stock <= 5 ? "#dc2626" : "#16a34a",
                        color: "#fff",
                      }}
                    >
                      {item.stock} in stock
                    </div>
                  </div>

                  <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#261a17" }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: "#8b7c76", marginTop: 2 }}>
                        {item.fabric} • Size {item.size}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#b06354" }}>₹{item.salePrice}</span>
                      <Link
                        href="/pos"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#b06354",
                          textDecoration: "none",
                        }}
                      >
                        Bill item &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const cell = {
  padding: "12px 16px",
  textAlign: "left" as const,
};
