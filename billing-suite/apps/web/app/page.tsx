"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, DEMO_ACCOUNT } from "../lib/api";

export default function BillVortexLandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({
    email: "",
    password: "",
    name: "",
    businessName: "",
    stateCode: "27",
    gstin: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Live POS Mockup Interactive State
  const [mockSelectedCategory, setMockSelectedCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showDemoVideoModal, setShowDemoVideoModal] = useState(false);
  const [pendingAfterLogin, setPendingAfterLogin] = useState<string>("/pos");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);

      const params = new URLSearchParams(window.location.search);
      if (params.get("login") === "true" && !token) {
        setShowAuthModal(true);
      }
    }
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_name");
    }
    setIsLoggedIn(false);
  }

  function handleProtectedAction(dest: string) {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      if (dest === "video") {
        setShowDemoVideoModal(true);
      } else {
        router.push(dest);
      }
    } else {
      setPendingAfterLogin(dest);
      setMode("login");
      setErr("");
      setShowAuthModal(true);
    }
  }

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const emailClean = f.email.trim().toLowerCase();
      const passClean = f.password;

      if (mode === "login") {
        // Check authorized Demo ID or previously registered local store accounts
        let validLocal =
          emailClean === DEMO_ACCOUNT.email.toLowerCase() && passClean === DEMO_ACCOUNT.password;

        if (!validLocal && typeof window !== "undefined") {
          try {
            const savedAccounts: Array<{ email: string; password: string; name?: string }> = JSON.parse(
              localStorage.getItem("billvortex_registered_accounts") || "[]"
            );
            validLocal = savedAccounts.some(
              (acc) => acc.email.toLowerCase() === emailClean && acc.password === passClean
            );
          } catch {}
        }

        if (!validLocal) {
          setErr("Invalid Demo ID or password. Please enter your authorized credentials.");
          setLoading(false);
          return;
        }
      } else {
        // Save newly registered trial store locally
        if (typeof window !== "undefined") {
          try {
            const savedAccounts = JSON.parse(
              localStorage.getItem("billvortex_registered_accounts") || "[]"
            );
            savedAccounts.push({
              email: emailClean,
              password: passClean,
              name: f.businessName || "Store Manager",
            });
            localStorage.setItem("billvortex_registered_accounts", JSON.stringify(savedAccounts));
          } catch {}
        }
      }

      const body =
        mode === "login"
          ? { email: emailClean, password: passClean }
          : { ...f, email: emailClean, gstin: f.gstin || undefined };

      const r = await api<{ token: string }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      }).catch(() => ({ token: "demo-token" }));

      if (typeof window !== "undefined") {
        localStorage.setItem("token", r.token || "demo-token");
        localStorage.setItem("user_email", emailClean);
        localStorage.setItem("user_name", f.businessName || "Store Manager");
      }

      setIsLoggedIn(true);
      setShowAuthModal(false);

      if (pendingAfterLogin === "video") {
        setShowDemoVideoModal(true);
      } else {
        router.push(pendingAfterLogin || "/pos");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf7f2",
        color: "#261b18",
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* 1. TOP NAVBAR */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 28px" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo Brand with Lotus Emblem */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #b06354 0%, #8e473a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 18,
                boxShadow: "0 4px 12px rgba(176, 99, 84, 0.25)",
              }}
            >
              🌸
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#231815", letterSpacing: "-0.03em", lineHeight: 1 }}>
                BillVortex
              </div>
              <div style={{ fontSize: 10, color: "#8b7c76", letterSpacing: "0.04em", marginTop: 2, fontWeight: 600 }}>
                Multi-Store Retail &amp; POS
              </div>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              fontSize: 13,
              fontWeight: 600,
              color: "#5f534e",
            }}
          >
            <a href="#features" style={{ color: "#5f534e", textDecoration: "none", transition: "color 0.15s ease" }}>
              Features
            </a>
            <a href="#industries" style={{ color: "#5f534e", textDecoration: "none", transition: "color 0.15s ease" }}>
              Industries
            </a>
            <a href="#pricing" style={{ color: "#5f534e", textDecoration: "none", transition: "color 0.15s ease" }}>
              Plans
            </a>
            <a href="#about" style={{ color: "#5f534e", textDecoration: "none", transition: "color 0.15s ease" }}>
              About
            </a>
            <a href="#faq" style={{ color: "#5f534e", textDecoration: "none", transition: "color 0.15s ease" }}>
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#8e7f78",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "8px 12px",
                  }}
                >
                  Sign Out
                </button>
                <Link
                  href="/pos"
                  style={{
                    background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                    color: "#ffffff",
                    borderRadius: 24,
                    padding: "9px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 4px 14px rgba(176, 99, 84, 0.35)",
                  }}
                >
                  <span>Open POS Counter →</span>
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#4a3e39",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "8px 12px",
                  }}
                >
                  Log in
                </button>

                <button
                  onClick={() => {
                    setPendingAfterLogin("/pos");
                    setMode("login");
                    setErr("");
                    setShowAuthModal(true);
                  }}
                  style={{
                    background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 24,
                    padding: "9px 22px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 4px 14px rgba(176, 99, 84, 0.35)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>Sign In →</span>
                </button>
              </>
            )}
          </div>
        </header>
      </div>

      {/* 3. HERO SECTION */}
      <section
        style={{
          maxWidth: 1280,
          margin: "24px auto 0",
          padding: "0 28px",
          display: "grid",
          gridTemplateColumns: "1.05fr 1.35fr",
          gap: 36,
          alignItems: "center",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#b06354",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Multi-Store Retail, Boutique &amp; General Store POS
            </span>
            <div style={{ width: 44, height: 1, background: "#b06354", opacity: 0.6 }} />
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 52,
              fontWeight: 700,
              color: "#261a17",
              letterSpacing: "-0.025em",
              lineHeight: 1.12,
              margin: 0,
              marginBottom: 20,
            }}
          >
            Every sale,<br />
            beautifully handled.
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "#6b5c56",
              lineHeight: 1.6,
              maxWidth: 480,
              margin: 0,
              marginBottom: 28,
            }}
          >
            BillVortex brings fast billing, formal PDF GST invoices, smart inventory, multi-branch control, and sales analytics into one calm workspace — built for boutiques, general stores, showrooms, and custom retail setups.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 32, flexWrap: "wrap" }}>
            <button
              onClick={() => handleProtectedAction("/pos")}
              style={{
                background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                color: "#ffffff",
                borderRadius: 24,
                padding: "12px 26px",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 6px 18px rgba(176, 99, 84, 0.35)",
              }}
            >
              <span>{isLoggedIn ? "Open POS Counter →" : "Sign In to Launch POS →"}</span>
            </button>

            <button
              onClick={() => handleProtectedAction("video")}
              style={{
                background: "#ffffff",
                border: "1px solid #e5d8cb",
                borderRadius: 24,
                padding: "11px 22px",
                fontSize: 13,
                fontWeight: 700,
                color: "#4a3d38",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ color: "#b06354", fontSize: 12 }}>{isLoggedIn ? "▶" : "🔒"}</span>
              <span>Watch Demo Video</span>
            </button>
          </div>

          {/* Quick Value Pills */}
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#6e605a", fontWeight: 600, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span>🔍</span> Fast product search
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span>👕</span> Size &amp; colour tracking
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span>📊</span> Clear sales reports
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Realistic Interactive POS Window */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 24px 60px -12px rgba(92, 57, 48, 0.18), 0 0 0 1px #eee4d8",
              overflow: "hidden",
              border: "1px solid #ecdcd0",
            }}
          >
            {/* Window Header */}
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #f1eae2",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#faf7f3",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>🌸</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#33221e" }}>BillVortex</span>
              </div>

              <div style={{ flex: 1, maxWidth: 320, position: "relative" }}>
                <input
                  readOnly
                  placeholder="Search by product name, SKU, barcode, color..."
                  value=""
                  style={{
                    width: "100%",
                    padding: "6px 28px 6px 10px",
                    background: "#ffffff",
                    border: "1px solid #e3d5c9",
                    borderRadius: 6,
                    fontSize: 10,
                    color: "#555",
                    outline: "none",
                  }}
                />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, opacity: 0.5 }}>
                  📷
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#776862" }}>
                <span>📍 Main Store</span>
                <span>👤 Cashier</span>
                <span>⚙️</span>
              </div>
            </div>

            {/* Split Screen Preview */}
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 220px", minHeight: 330, background: "#ffffff" }}>
              {/* Mini Left Sidebar */}
              <div
                style={{
                  borderRight: "1px solid #f0e6dc",
                  padding: "10px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  background: "#fbf8f5",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {[
                  { name: "Billing", icon: "🧾", active: true },
                  { name: "Products", icon: "👗", active: false },
                  { name: "Inventory", icon: "📦", active: false },
                  { name: "Customers", icon: "👥", active: false },
                  { name: "Returns", icon: "🔄", active: false },
                  { name: "Analytics", icon: "📊", active: false },
                  { name: "GST Reports", icon: "🏛️", active: false },
                  { name: "About", icon: "✨", active: false },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleProtectedAction("/pos")}
                    style={{
                      padding: "6px 8px",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      border: "none",
                      background: item.active ? "#b06354" : "transparent",
                      color: item.active ? "#ffffff" : "#6f5e58",
                      fontWeight: item.active ? 700 : 500,
                      textAlign: "left",
                      fontSize: 10,
                    }}
                  >
                    <span style={{ fontSize: 11 }}>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>

              {/* Center: Category Pills + Apparel Grid */}
              <div style={{ padding: "10px 12px", borderRight: "1px solid #f0e6dc" }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto" }}>
                  {["All", "Ethnic", "Western", "Dresses", "Kurtas"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMockSelectedCategory(cat)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 12,
                        fontSize: 9,
                        fontWeight: 700,
                        border: mockSelectedCategory === cat ? "1px solid #b06354" : "1px solid #ecdcd0",
                        background: mockSelectedCategory === cat ? "#b06354" : "#fbf8f5",
                        color: mockSelectedCategory === cat ? "#ffffff" : "#6e5f58",
                        cursor: "pointer",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { name: "Chanderi Silk Kurta", price: "₹1,299", img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80" },
                    { name: "Floral Anarkali Suit", price: "₹1,899", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80" },
                    { name: "Banarasi Silk Saree", price: "₹2,499", img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=80" },
                    { name: "Wide-Leg Denim Jeans", price: "₹1,499", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop&q=80" },
                  ].map((p, i) => (
                    <div
                      key={i}
                      style={{
                        border: "1px solid #ebdcd0",
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "#fff",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.img} alt={p.name} style={{ width: "100%", height: 72, objectFit: "cover" }} />
                      <div style={{ padding: "4px 6px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#2d201c", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: "#b06354", marginTop: 1 }}>{p.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Cart Summary */}
              <div style={{ padding: "10px 12px", background: "#fbf8f5", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#2d201c", marginBottom: 8 }}>
                    Current Bill (2 items)
                  </div>
                  <div style={{ borderBottom: "1px dashed #ebdcd0", paddingBottom: 6, marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700, color: "#2d201c" }}>
                      <span>Floral Anarkali</span>
                      <span>₹1,899</span>
                    </div>
                    <div style={{ fontSize: 8, color: "#8e7f78" }}>Size: L • Qty: 1</div>
                  </div>
                  <div style={{ borderBottom: "1px dashed #ebdcd0", paddingBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700, color: "#2d201c" }}>
                      <span>Wide-Leg Jeans</span>
                      <span>₹1,499</span>
                    </div>
                    <div style={{ fontSize: 8, color: "#8e7f78" }}>Size: 30 • Qty: 1</div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 800, color: "#261a17", borderTop: "1px solid #ebdcd0", paddingTop: 6, marginBottom: 8 }}>
                    <span>Grand Total</span>
                    <span>₹3,398</span>
                  </div>
                  <button
                    onClick={() => handleProtectedAction("/pos")}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Proceed to POS Counter →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: FEATURES */}
      <section id="features" style={{ maxWidth: 1280, margin: "72px auto 0", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#b06354", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            POS &amp; Store Intelligence
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#261b18",
              letterSpacing: "-0.02em",
              margin: "8px 0 0",
            }}
          >
            Everything your retail business needs to run smoothly
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {/* Card 1 */}
          <div
            onClick={() => handleProtectedAction("/pos")}
            style={{
              background: "#ffffff",
              border: "1px solid #ede3d8",
              borderRadius: 16,
              padding: "24px 22px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              cursor: "pointer",
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fbf3ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#b06354", fontSize: 20, marginBottom: 14 }}>
              💳
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#261b18", margin: 0, marginBottom: 8 }}>
              Fast billing &amp; PDF receipts
            </h3>
            <p style={{ fontSize: 13, color: "#71635e", lineHeight: 1.5, margin: 0 }}>
              Add products, apply discounts, compute GST, and share formal PDF tax receipts in seconds.
            </p>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => handleProtectedAction("/inventory")}
            style={{
              background: "#ffffff",
              border: "1px solid #ede3d8",
              borderRadius: 16,
              padding: "24px 22px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              cursor: "pointer",
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fbf3ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#b06354", fontSize: 20, marginBottom: 14 }}>
              📦
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#261b18", margin: 0, marginBottom: 8 }}>
              Smart stock &amp; variant tracking
            </h3>
            <p style={{ fontSize: 13, color: "#71635e", lineHeight: 1.5, margin: 0 }}>
              Track sizes, colours, fabrics, barcodes, batch/MRP items, and low-stock alerts across outlets.
            </p>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => handleProtectedAction("/dashboard")}
            style={{
              background: "#ffffff",
              border: "1px solid #ede3d8",
              borderRadius: 16,
              padding: "24px 22px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              cursor: "pointer",
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fbf3ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#b06354", fontSize: 20, marginBottom: 14 }}>
              🏪
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#261b18", margin: 0, marginBottom: 8 }}>
              Multi-store &amp; branch control
            </h3>
            <p style={{ fontSize: 13, color: "#71635e", lineHeight: 1.5, margin: 0 }}>
              Run multiple boutiques, general stores, or warehouses under one unified owner dashboard.
            </p>
          </div>

          {/* Card 4 */}
          <div
            onClick={() => handleProtectedAction("/reports")}
            style={{
              background: "#ffffff",
              border: "1px solid #ede3d8",
              borderRadius: 16,
              padding: "24px 22px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              cursor: "pointer",
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fbf3ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#b06354", fontSize: 20, marginBottom: 14 }}>
              📊
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#261b18", margin: 0, marginBottom: 8 }}>
              Sales, profit &amp; GST reports
            </h3>
            <p style={{ fontSize: 13, color: "#71635e", lineHeight: 1.5, margin: 0 }}>
              Get real-time sales velocity, GSTR-1 exports, Z-reports, and payment reconciliation in one click.
            </p>
          </div>
        </div>
      </section>

      {/* 4B. SECTION: INDUSTRIES & MULTI-STORE FLEXIBILITY */}
      <section id="industries" style={{ maxWidth: 1280, margin: "76px auto 0", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#b06354", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Not Just For One Boutique — Built For Every Retail Format
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#261b18",
              letterSpacing: "-0.02em",
              margin: "8px 0 0",
            }}
          >
            One Platform. Every Store Format.
          </h2>
          <p style={{ fontSize: 14, color: "#7a6e69", maxWidth: 660, margin: "10px auto 0", lineHeight: 1.6 }}>
            Whether you manage multiple fashion boutiques, a busy neighborhood general store, or a custom multi-category showroom, BillVortex adapts to your exact catalog, billing units, and GST slabs.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          {[
            {
              icon: "👗",
              title: "Fashion Boutiques & Multi-Branch Showrooms",
              badge: "Live Demo Loaded",
              desc: "Manage multiple boutique branches with size/color/fabric matrices, bridal order tracking, alteration notes, and centralized stock transfers.",
            },
            {
              icon: "🛒",
              title: "General Stores, Kirana & Supermarkets",
              badge: "High-Speed Barcode",
              desc: "Rapid MRP & barcode billing, loose weight/quantity units (KG, PCS, BOX, LTR), batch & expiry alerts, and instant thermal or PDF receipts.",
            },
            {
              icon: "🧵",
              title: "Textile, Saree & Garment Wholesalers",
              badge: "B2B + B2C Ready",
              desc: "Track unstitched fabric meterage & rolls, party-wise GSTIN invoicing, credit days, supplier mills, and automated Khata ledger recovery.",
            },
            {
              icon: "👠",
              title: "Footwear, Cosmetics & Lifestyle Retail",
              badge: "Variant Matrix",
              desc: "Organize products by brand, shade, shoe size, or combo pack with seasonal offer presets, barcode sticker printing, and loyalty tracking.",
            },
            {
              icon: "🏬",
              title: "Multi-Outlet & Franchise Chains",
              badge: "Central Control",
              desc: "Monitor live sales across all locations from one owner screen, compare branch performance, and enforce cashier discount limits by role.",
            },
            {
              icon: "⚙️",
              title: "Custom Store Setup (As Per Requirement)",
              badge: "Tailored Onboarding",
              desc: "Need custom invoice formats, specialized GST/HSN rules, or industry-specific fields (electronics, gifts, pharmacy, hardware)? We configure it for you.",
            },
          ].map((ind) => (
            <div
              key={ind.title}
              style={{
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 16,
                padding: "22px 22px",
                boxShadow: "0 2px 10px rgba(92, 57, 48, 0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "#fbf3ef",
                      border: "1px solid #f0dfd4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 21,
                    }}
                  >
                    {ind.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 12,
                      background: "#faf4ee",
                      color: "#b06354",
                      border: "1px solid #ebdcd0",
                    }}
                  >
                    {ind.badge}
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#261a17", margin: "0 0 8px" }}>
                  {ind.title}
                </h3>
                <p style={{ fontSize: 13, color: "#71635e", lineHeight: 1.55, margin: 0 }}>{ind.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4C. SECTION: PRICING PLANS (PRO, PRO+, ULTRA) */}
      <section id="pricing" style={{ maxWidth: 1200, margin: "80px auto 0", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#b06354", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Transparent Retail Plans
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 36,
              fontWeight: 700,
              color: "#261b18",
              letterSpacing: "-0.02em",
              margin: "8px 0 0",
            }}
          >
            Choose the Right Plan for Your Store
          </h2>
          <p style={{ fontSize: 14, color: "#7a6e69", maxWidth: 580, margin: "10px auto 22px" }}>
            Start with a 14-day free trial. Upgrade anytime as you add counters, staff, or new branches.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#efe6dc",
              padding: 4,
              borderRadius: 30,
              border: "1px solid #e4d4c6",
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              style={{
                padding: "7px 18px",
                borderRadius: 24,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background: billingCycle === "monthly" ? "#ffffff" : "transparent",
                color: billingCycle === "monthly" ? "#261a17" : "#7a6e69",
                boxShadow: billingCycle === "monthly" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              style={{
                padding: "7px 18px",
                borderRadius: 24,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background: billingCycle === "yearly" ? "#b06354" : "transparent",
                color: billingCycle === "yearly" ? "#ffffff" : "#7a6e69",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: billingCycle === "yearly" ? "0 2px 8px rgba(176,99,84,0.3)" : "none",
              }}
            >
              <span>Yearly</span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: billingCycle === "yearly" ? "rgba(255,255,255,0.22)" : "#ecfdf5",
                  color: billingCycle === "yearly" ? "#ffffff" : "#059669",
                  fontWeight: 800,
                }}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Plan Cards: Pro, Pro+, Ultra */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22, alignItems: "stretch" }}>
          {[
            {
              name: "Pro",
              subtitle: "Ideal for single boutiques, general stores & retail shops",
              monthly: 799,
              yearly: 639,
              highlight: false,
              badge: "Starter Retail",
              cta: "Start Pro Free Trial →",
              features: [
                "1 Store / Outlet & 2 Cashier Logins",
                "Unlimited Invoices & Formal A4 PDF Receipts",
                "WhatsApp PDF Dispatch & Thermal Slip Print",
                "Inventory & Low-Stock Alerts (up to 2,500 SKUs)",
                "Auto GST Engine (0% / 5% / 12% / 18%) + GSTR-1 CSV",
                "Customer Khata Ledger & Balance Reminders",
                "Day-End Z-Report & Payment Mode Audit",
              ],
            },
            {
              name: "Pro+",
              subtitle: "Built for multi-branch boutiques, busy marts & showrooms",
              monthly: 1499,
              yearly: 1199,
              highlight: true,
              badge: "Most Popular",
              cta: "Choose Pro+ Plan →",
              features: [
                "Up to 3 Stores / Branches & 10 Staff Logins",
                "Everything in Pro + Unlimited SKUs & Variants",
                "Multi-Branch Stock Transfers & Consolidated View",
                "Supplier / Fabric Mill Directory & Purchase Orders",
                "Advanced Sales Velocity, Margin & Peak-Hour Analytics",
                "Role-Based Permissions & Cashier Discount Caps",
                "Priority Onboarding, WhatsApp & Phone Support",
              ],
            },
            {
              name: "Ultra",
              subtitle: "For retail chains, wholesalers & custom store requirements",
              monthly: 2999,
              yearly: 2399,
              highlight: false,
              badge: "Enterprise & Custom",
              cta: "Launch Ultra Suite →",
              features: [
                "Unlimited Stores / Franchises & Unlimited Staff",
                "Everything in Pro+ + Custom Industry Workflow Setup",
                "Official WhatsApp Business API Auto-PDF Delivery",
                "Custom Branded PDF Letterhead & Barcode Labels",
                "Tally / Busy Accounting Sync & Full Audit Trail",
                "Multi-Warehouse & B2B Wholesale Credit Controls",
                "Dedicated Account Manager & 24×7 Priority SLA",
              ],
            },
          ].map((plan) => {
            const price = billingCycle === "yearly" ? plan.yearly : plan.monthly;
            return (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight
                    ? "linear-gradient(180deg, #ffffff 0%, #fdf7f3 100%)"
                    : "#ffffff",
                  border: plan.highlight ? "2px solid #b06354" : "1px solid #ebdcd0",
                  borderRadius: 20,
                  padding: "28px 26px",
                  boxShadow: plan.highlight
                    ? "0 20px 44px rgba(176, 99, 84, 0.16)"
                    : "0 4px 16px rgba(92, 57, 48, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 26,
                        fontWeight: 800,
                        color: "#261a17",
                        margin: 0,
                      }}
                    >
                      {plan.name}
                    </h3>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 14,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background: plan.highlight ? "#b06354" : "#fbf3ef",
                        color: plan.highlight ? "#ffffff" : "#b06354",
                        border: plan.highlight ? "none" : "1px solid #ebdcd0",
                      }}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: 12.5, color: "#7a6e69", margin: "0 0 18px", lineHeight: 1.5 }}>
                    {plan.subtitle}
                  </p>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 38,
                        fontWeight: 800,
                        color: "#261a17",
                      }}
                    >
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 13, color: "#7a6e69", fontWeight: 600 }}>/ month</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9a8b84", marginBottom: 20 }}>
                    {billingCycle === "yearly"
                      ? `Billed ₹${(price * 12).toLocaleString("en-IN")} yearly (Save ₹${((plan.monthly - plan.yearly) * 12).toLocaleString("en-IN")}/yr)`
                      : "Billed monthly • Cancel or switch anytime"}
                  </div>

                  <div style={{ borderTop: "1px solid #efe5db", paddingTop: 18, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                    {plan.features.map((feat) => (
                      <div key={feat} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12.5, color: "#4a3c36", lineHeight: 1.45 }}>
                        <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 13 }}>✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(`${plan.name} (₹${price.toLocaleString("en-IN")}/mo)`);
                    setMode("register");
                    setShowAuthModal(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: plan.highlight ? "none" : "1px solid #b06354",
                    background: plan.highlight
                      ? "linear-gradient(135deg, #b06354 0%, #9e5345 100%)"
                      : "#ffffff",
                    color: plan.highlight ? "#ffffff" : "#b06354",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: plan.highlight ? "0 6px 18px rgba(176, 99, 84, 0.32)" : "none",
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. SECTION: ABOUT */}
      <section id="about" style={{ maxWidth: 1280, margin: "64px auto 0", padding: "0 28px" }}>
        {/* Hero Card */}
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
            <span>🏪 MULTI-STORE RETAIL POS</span>
            <span>•</span>
            <span>BOUTIQUES, GENERAL STORES &amp; CUSTOM SETUPS</span>
          </div>

          <h2
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
          </h2>

          <p style={{ fontSize: 16, color: "#6e5d57", lineHeight: 1.6, maxWidth: 840, margin: 0, marginBottom: 26 }}>
            BillVortex is a high-speed Point-of-Sale (POS) and multi-store retail management platform built for Indian businesses — from single &amp; multi-branch fashion boutiques and textile showrooms to general stores, supermarkets, and custom retail setups tailored to your exact workflow.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button
              onClick={() => handleProtectedAction("/pos")}
              style={{
                padding: "11px 24px",
                fontSize: 13,
                fontWeight: 600,
                color: "#ffffff",
                background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                borderRadius: 24,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(176, 99, 84, 0.25)",
              }}
            >
              Launch POS Counter →
            </button>
            <button
              onClick={() => handleProtectedAction("/dashboard")}
              style={{
                padding: "11px 22px",
                fontSize: 13,
                fontWeight: 600,
                color: "#261a17",
                background: "#ffffff",
                border: "1px solid #ebdcd0",
                borderRadius: 24,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
              }}
            >
              View Live Dashboard
            </button>
          </div>
        </div>

        {/* 6 Capabilities Cards */}
        <div>
          <h3
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 24,
              fontWeight: 700,
              color: "#261a17",
              marginBottom: 20,
            }}
          >
            Multi-Store Capabilities &amp; Retail Architecture
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
              <h4 style={cardHeadingStyle}>Formal PDF Tax Invoices &amp; WhatsApp</h4>
              <p style={cardTextStyle}>
                Generate GST-compliant A4 PDF receipts with your store letterhead, GSTIN, tax split, and amount in words in under 5 seconds — ready to share on WhatsApp, download, or print.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🏪</div>
              <h4 style={cardHeadingStyle}>Boutiques, General Stores &amp; Multi-Branch</h4>
              <p style={cardTextStyle}>
                Adaptable catalog engine supporting fashion sizes/colors/fabrics, general store barcodes &amp; MRP packs, loose weight/meterage units, and multi-outlet stock transfers.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🏛️</div>
              <h4 style={cardHeadingStyle}>Deterministic Indian GST Engine</h4>
              <p style={cardTextStyle}>
                Automates GST compliance across 0%, 5%, 12%, and 18% slabs with exact CGST/SGST/IGST splits, one-click GSTR-1 CSV files, and downloadable Day-End Z-Report PDFs.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🏷️</div>
              <h4 style={cardHeadingStyle}>Flexible Discounts &amp; Cashier Controls</h4>
              <p style={cardTextStyle}>
                Apply item-level or bill-level discounts in flat rupees (₹) or percentage (%) with preset buttons and role-based cashier discount approval limits.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>👥</div>
              <h4 style={cardHeadingStyle}>Customer Khata &amp; Receivables Ledger</h4>
              <p style={cardTextStyle}>
                Manage walk-in VIPs, regular general store accounts, and B2B wholesale buyers with live balances, payment recording, and polite WhatsApp reminders.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🚚</div>
              <h4 style={cardHeadingStyle}>Supplier, Mill &amp; Distributor Directory</h4>
              <p style={cardTextStyle}>
                Track textile mills, FMCG distributors, and wholesalers with GSTIN, credit terms, accounts payable, purchase requisitions, and on-time dispatch tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: SERVICES */}
      <section id="services" style={{ maxWidth: 1280, margin: "72px auto 0", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#b06354", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Tailored As Per Your Store Requirement
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#261b18",
              letterSpacing: "-0.02em",
              margin: "8px 0 0",
            }}
          >
            Comprehensive Retail Services &amp; Solutions
          </h2>
          <p style={{ fontSize: 14, color: "#7a6e69", maxWidth: 640, margin: "10px auto 0" }}>
            End-to-end POS, inventory, and GST automation engineered for fashion boutiques, multi-branch showrooms, general stores, and growing Indian retail businesses.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>🧾</div>
            <h3 style={serviceTitleStyle}>High-Speed Touch POS &amp; Barcode Desk</h3>
            <p style={serviceDescStyle}>
              Intuitive touch-ready catalog grid with instant barcode/SKU search, keyboard hotkeys (F2), and multi-tender support for UPI QR, Cash, Cards, and Khata Credit.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>📦</div>
            <h3 style={serviceTitleStyle}>Flexible Multi-Category Inventory</h3>
            <p style={serviceDescStyle}>
              Track sizes, colors, and fabric rolls (MTR) for boutiques or MRP packs, weights (KG/LTR), and batch stock for general stores with automated low-stock alerts.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>📄</div>
            <h3 style={serviceTitleStyle}>Formal PDF Receipts &amp; WhatsApp</h3>
            <p style={serviceDescStyle}>
              Automatically generate crisp A4 PDF Tax Invoices with store branding, GSTIN, and Amount in Words — share directly on WhatsApp or print via A4 &amp; thermal printers.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>🏛️</div>
            <h3 style={serviceTitleStyle}>Indian GST Calculation &amp; GSTR-1</h3>
            <p style={serviceDescStyle}>
              Automatic multi-slab GST computation (0%, 5%, 12%, 18%) with CGST/SGST splits, downloadable GSTR-1 CSV reports, and formal Day-End Z-Reports for your CA.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>👥</div>
            <h3 style={serviceTitleStyle}>Customer Khata &amp; Credit Ledger</h3>
            <p style={serviceDescStyle}>
              Maintain individual customer credit accounts, monitor lifetime spend and overdue balances, record partial settlements, and send one-click WhatsApp reminders.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>🚚</div>
            <h3 style={serviceTitleStyle}>Suppliers, Mills &amp; Purchase Orders</h3>
            <p style={serviceDescStyle}>
              Manage vendors, textile mills, and wholesalers with GSTIN, credit days, pending shipments, and direct purchase requisitions from one procurement ledger.
            </p>
          </div>
        </div>
      </section>

      {/* 7. SECTION: FAQ */}
      <section id="faq" style={{ maxWidth: 1000, margin: "72px auto 0", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#b06354", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Got Questions?
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#261b18",
              letterSpacing: "-0.02em",
              margin: "8px 0 0",
            }}
          >
            Customer FAQs for BillVortex
          </h2>
          <p style={{ fontSize: 14, color: "#7a6e69", margin: "10px auto 0" }}>
            Everything you need to know about pricing, free trials, GST invoicing, and store setup.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            {
              q: "How much does BillVortex cost?",
              a: "BillVortex offers three transparent plans designed for every stage of retail growth:\n• Pro — ₹799/month (or ₹639/mo billed yearly): Ideal for single boutiques, general stores, and retail shops with unlimited PDF billing, GST reports, and Khata.\n• Pro+ — ₹1,499/month (or ₹1,199/mo billed yearly): Built for up to 3 branches with unlimited SKUs, supplier & purchase order management, and advanced analytics.\n• Ultra — ₹2,999/month (or ₹2,399/mo billed yearly): Unlimited branches, custom store workflows tailored to your business, Tally sync, and dedicated 24×7 support.\nThere are no hidden setup charges, and you can upgrade or switch plans anytime.",
            },
            {
              q: "Can I try BillVortex before purchasing?",
              a: "Yes! Every new store gets a full-featured 14-day free trial with no credit card required. Request your personal Demo Login ID from our team to explore the live interactive workspace — including quick billing, formal PDF receipts, inventory updates, supplier tracking, and GST reports.",
            },
            {
              q: "Is BillVortex suitable for my small shop?",
              a: "Absolutely. BillVortex is designed to feel effortless for a single-counter boutique, neighborhood general store, kirana shop, or garment outlet — while still having the power to scale to multiple branches as you grow. It runs smoothly on any regular Windows laptop, desktop, or tablet with no expensive POS hardware required.",
            },
            {
              q: "Can I create GST invoices using BillVortex?",
              a: "Yes. BillVortex includes an automated Indian GST engine supporting 0%, 5%, 12%, and 18% slabs (including apparel threshold rules of 5% up to ₹1,000 and 12% above ₹1,000). Every bill automatically calculates CGST & SGST, generates a formal A4 PDF Tax Invoice with your GSTIN, HSN summary, and Amount in Words, and exports one-click GSTR-1 CSV reports for your CA.",
            },
            {
              q: "Do I need accounting knowledge to use BillVortex?",
              a: "Not at all. BillVortex is built for store owners and billing counter staff, not accountants. Creating a bill takes under 5 seconds by tapping items or scanning barcodes — tax splits, discounts, stock deductions, and Day-End Z-Reports are all calculated automatically in plain, easy-to-understand summaries.",
            },
            {
              q: "Can BillVortex handle multiple boutiques, general stores, or custom business types?",
              a: "Yes. Even though our live demo showcases a fashion boutique catalog, BillVortex is fully configurable for multi-branch boutiques, general stores, supermarkets, saree wholesalers, footwear shops, cosmetics, and custom retail setups. We configure categories, units (PCS, KG, MTR, BOX), tax slabs, and invoice branding as per your requirement.",
            },
            {
              q: "How are formal PDF receipts sent to customers on WhatsApp?",
              a: "On checkout, BillVortex generates a formal, print-ready A4 PDF Tax Invoice carrying your store letterhead, GSTIN, itemized breakdown, and tax totals. You can immediately dispatch the PDF via WhatsApp, share it directly from mobile/tablet POS devices, download it, or print a formal A4 / thermal copy.",
            },
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.04)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: "100%",
                    padding: "18px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: isOpen ? "#fcf9f5" : "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#261a17" }}>
                    {item.q}
                  </span>
                  <span style={{ fontSize: 18, color: "#b06354", fontWeight: 700 }}>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 22px 18px", color: "#6e5d57", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-line", borderTop: "1px solid #f4ebe1" }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer
        style={{
          marginTop: 80,
          borderTop: "1px solid #ebdcd0",
          background: "#faf5ef",
          padding: "36px 28px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🌸</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#261a17" }}>BillVortex Retail &amp; POS Suite</div>
              <div style={{ fontSize: 11, color: "#8e7f78" }}>Boutiques • General Stores • Multi-Branch Retail • v2.5</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, fontSize: 12, fontWeight: 600, color: "#6e5d57" }}>
            <a href="#features" style={{ color: "#6e5d57", textDecoration: "none" }}>Features</a>
            <a href="#industries" style={{ color: "#6e5d57", textDecoration: "none" }}>Industries</a>
            <a href="#pricing" style={{ color: "#6e5d57", textDecoration: "none" }}>Plans</a>
            <a href="#about" style={{ color: "#6e5d57", textDecoration: "none" }}>About</a>
            <a href="#faq" style={{ color: "#6e5d57", textDecoration: "none" }}>FAQ</a>
          </div>

          <div style={{ fontSize: 11, color: "#9a8b84" }}>
            © 2026 BillVortex. All rights reserved.
          </div>
        </div>
      </footer>

      {/* 9. DEMO VIDEO PLAYER MODAL */}
      {showDemoVideoModal && (
        <div
          onClick={() => setShowDemoVideoModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(38, 27, 24, 0.78)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 960,
              maxWidth: "100%",
              background: "#1c1412",
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid #4a352f",
              boxShadow: "0 28px 70px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
                  BillVortex Full Product Walkthrough (1080p HD)
                </div>
                <div style={{ fontSize: 11.5, color: "#c9b5aa" }}>
                  POS Counter • Formal PDF Receipts • Multi-Branch Dashboard • Stock, Suppliers, Khata &amp; GST
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <a
                  href="/demo/BillVortex_Demo_Video.mp4"
                  download="BillVortex_Demo_Video.mp4"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "#b06354",
                    color: "#ffffff",
                    fontSize: 11.5,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  ⬇ Download MP4
                </a>
                <button
                  onClick={() => setShowDemoVideoModal(false)}
                  style={{ background: "transparent", border: "none", color: "#c9b5aa", fontSize: 22, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>
            <video
              src="/demo/BillVortex_Demo_Video.mp4"
              controls
              autoPlay
              style={{ width: "100%", maxHeight: "75vh", display: "block", background: "#000" }}
            />
          </div>
        </div>
      )}

      {/* 10. AUTHENTICATION & LOGIN MODAL (With Demo Account Highlights) */}
      {showAuthModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(38, 27, 24, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              width: 440,
              maxWidth: "100%",
              padding: 32,
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 24px 60px rgba(92, 57, 48, 0.25)",
              border: "1px solid #ebdcd0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>🌸</span>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#261a17", margin: 0 }}>
                    {mode === "login" ? "Store Sign In" : "Start Free Trial"}
                  </h3>
                  <div style={{ fontSize: 11, color: "#8e7f78", marginTop: 2 }}>
                    {pendingAfterLogin === "video"
                      ? "Sign in with your authorized ID to watch the private demo video"
                      : selectedPlan
                      ? `Selected Plan: ${selectedPlan}`
                      : "Sign in with your Store / Demo ID to access POS & Reports"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{ background: "transparent", border: "none", color: "#8e7f78", fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Switch Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "#f4ede5",
                padding: 4,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={() => setMode("login")}
                style={{
                  padding: "7px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12,
                  background: mode === "login" ? "#ffffff" : "transparent",
                  color: mode === "login" ? "#b06354" : "#7c6c66",
                  boxShadow: mode === "login" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                style={{
                  padding: "7px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12,
                  background: mode === "register" ? "#ffffff" : "transparent",
                  color: mode === "register" ? "#b06354" : "#7c6c66",
                  boxShadow: mode === "register" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                }}
              >
                New Store
              </button>
            </div>

            {err && (
              <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>
                {err}
              </div>
            )}

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "register" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6e605a", marginBottom: 4 }}>
                      Store / Boutique Legal Name
                    </label>
                    <input
                      style={modalInputStyle}
                      value={f.businessName}
                      onChange={set("businessName")}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6e605a", marginBottom: 4 }}>
                        State Code
                      </label>
                      <input
                        style={modalInputStyle}
                        value={f.stateCode}
                        onChange={set("stateCode")}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6e605a", marginBottom: 4 }}>
                        GSTIN (Optional)
                      </label>
                      <input
                        style={modalInputStyle}
                        value={f.gstin}
                        onChange={set("gstin")}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6e605a", marginBottom: 4 }}>
                  Email Address / Username
                </label>
                <input
                  type="email"
                  style={modalInputStyle}
                  value={f.email}
                  onChange={set("email")}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6e605a", marginBottom: 4 }}>
                  Password
                </label>
                <input
                  type="password"
                  style={modalInputStyle}
                  value={f.password}
                  onChange={set("password")}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 4,
                  boxShadow: "0 4px 12px rgba(176, 99, 84, 0.3)",
                }}
              >
                {loading
                  ? "Authenticating..."
                  : mode === "login"
                  ? pendingAfterLogin === "video"
                    ? "Sign In & Watch Demo Video →"
                    : "Sign In to Workspace →"
                  : "Create Trial Store →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalInputStyle = {
  width: "100%",
  padding: "9px 12px",
  background: "#fdfaf7",
  border: "1px solid #ebdcd0",
  borderRadius: 8,
  fontSize: 13,
  color: "#261a17",
  outline: "none",
};

const boutiqueCardStyle = {
  background: "#ffffff",
  border: "1px solid #ebdcd0",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
};

const cardHeadingStyle = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 17,
  fontWeight: 700,
  color: "#261a17",
  margin: "0 0 8px",
};

const cardTextStyle = {
  fontSize: 13,
  color: "#7a6e69",
  lineHeight: 1.5,
  margin: 0,
};

const serviceCardStyle = {
  background: "#ffffff",
  border: "1px solid #ede3d8",
  borderRadius: 16,
  padding: "26px 24px",
  boxShadow: "0 2px 10px rgba(92, 57, 48, 0.04)",
};

const serviceIconBadgeStyle = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "#fbf3ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  marginBottom: 16,
};

const serviceTitleStyle = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 18,
  fontWeight: 700,
  color: "#261a17",
  margin: "0 0 10px",
};

const serviceDescStyle = {
  fontSize: 13,
  color: "#71635e",
  lineHeight: 1.55,
  margin: 0,
};
