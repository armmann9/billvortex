"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "../../lib/api";
import Sidebar from "../components/Sidebar";

export default function AboutPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/?login=true");
    }
  }, [router]);
  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", background: "#faf7f2", color: "#261a17", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {/* Hero Section inspired by Boutique Design */}
          <div
            style={{
              padding: "44px 40px",
              borderRadius: 20,
              background: "linear-gradient(135deg, #ffffff 0%, #fbf5f0 100%)",
              border: "1px solid #ebdcd0",
              boxShadow: "0 4px 20px rgba(92, 57, 48, 0.06)",
              marginBottom: 36,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 20,
                background: "#fbf3ef",
                border: "1px solid #ebdcd0",
                color: "#b06354",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 18,
              }}
            >
              <span>🌸 LUXURY BOUTIQUE POS</span>
              <span>•</span>
              <span>TEXTILE & APPAREL SUITE</span>
            </div>

            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 38,
                fontWeight: 700,
                color: "#261a17",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                margin: 0,
                marginBottom: 16,
              }}
            >
              What is <span style={{ color: "#b06354" }}>BillVortex</span>?
            </h1>

            <p style={{ fontSize: 16, color: "#6e5d57", lineHeight: 1.6, maxWidth: 780, margin: 0, marginBottom: 26 }}>
              BillVortex is a high-speed, hybrid Point-of-Sale (POS) and boutique management platform engineered specifically for women&apos;s fashion boutiques, apparel designers, saree showrooms, and textile retail houses.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link
                href="/pos"
                style={{
                  padding: "11px 24px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                  borderRadius: 24,
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(176, 99, 84, 0.25)",
                  display: "inline-block",
                }}
              >
                Launch POS Counter →
              </Link>
              <Link
                href="/dashboard"
                style={{
                  padding: "11px 22px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#261a17",
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 24,
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                  display: "inline-block",
                }}
              >
                View Live Dashboard
              </Link>
            </div>
          </div>

          {/* Core Feature Pillars */}
          <div style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#261a17",
                marginBottom: 20,
              }}
            >
              Boutique Capabilities & Design Architecture
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {/* Feature 1 */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#261a17", margin: 0, marginBottom: 8 }}>
                  Instant Quick Bill & WhatsApp Dispatch
                </h3>
                <p style={{ fontSize: 13, color: "#7a6e69", lineHeight: 1.5, margin: 0 }}>
                  Generate compliant bills in under 5 seconds with quick hotkeys. Instantly formats an elegant digital tax invoice sent straight to the customer&apos;s WhatsApp with zero paper waste.
                </p>
              </div>

              {/* Feature 2 */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>👗</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#261a17", margin: 0, marginBottom: 8 }}>
                  Apparel & Fashion-First Catalog
                </h3>
                <p style={{ fontSize: 13, color: "#7a6e69", lineHeight: 1.5, margin: 0 }}>
                  Built for fashion retailers. Displays high-resolution individual apparel photography, garment names directly underneath, sizes (XS–XXL, Free Size), colors, fabrics, and live stock counts.
                </p>
              </div>

              {/* Feature 3 */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>🏛️</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#261a17", margin: 0, marginBottom: 8 }}>
                  Deterministic Indian GST Engine
                </h3>
                <p style={{ fontSize: 13, color: "#7a6e69", lineHeight: 1.5, margin: 0 }}>
                  Automates GST compliance. Automatically splits CGST & SGST (2.5% + 2.5% on garments below ₹1,000; 6% + 6% on luxury items over ₹1,000) and exports GSTR-1 reconciliations.
                </p>
              </div>

              {/* Feature 4 */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>🏷️</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#261a17", margin: 0, marginBottom: 8 }}>
                  Flexible Discounts & Seasonal Offers
                </h3>
                <p style={{ fontSize: 13, color: "#7a6e69", lineHeight: 1.5, margin: 0 }}>
                  Apply store discounts directly on the bill using flat rupee amounts (₹) or percentages (%), with instant preset quick buttons (5%, 10%, 15%, ₹100, ₹250) for fast cashier checkout.
                </p>
              </div>

              {/* Feature 5 */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>👥</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#261a17", margin: 0, marginBottom: 8 }}>
                  Customer Khata & Receivables Ledger
                </h3>
                <p style={{ fontSize: 13, color: "#7a6e69", lineHeight: 1.5, margin: 0 }}>
                  Manage boutique patron directories, track outstanding store credit balances, and dispatch polite WhatsApp balance reminders with one click.
                </p>
              </div>

              {/* Feature 6 */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>🚚</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#261a17", margin: 0, marginBottom: 8 }}>
                  Supplier & Textile Mill Directory
                </h3>
                <p style={{ fontSize: 13, color: "#7a6e69", lineHeight: 1.5, margin: 0 }}>
                  Organize textile mills, handloom weavers, and embroidery artisans from Surat, Jaipur, Lucknow, and Varanasi, including credit terms and instant WhatsApp requisition chats.
                </p>
              </div>
            </div>
          </div>

          {/* System Specs Footer */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ebdcd0",
              borderRadius: 16,
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#261a17" }}>BillVortex Edition: 2.4.0 (Boutique Edition)</div>
              <div style={{ fontSize: 12, color: "#7a6e69", marginTop: 2 }}>
                Next.js 14 App Router • Express REST API • Prisma ORM • PostgreSQL Ready
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>● All Systems Operational</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
