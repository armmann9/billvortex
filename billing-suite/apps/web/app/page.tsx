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
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
    name: DEMO_ACCOUNT.name,
    businessName: DEMO_ACCOUNT.businessName,
    stateCode: "08",
    gstin: "08AAAAA0000A1Z5",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Live POS Mockup Interactive State
  const [mockSelectedCategory, setMockSelectedCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
      router.push(dest);
    } else {
      setShowAuthModal(true);
    }
  }

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const body =
        mode === "login"
          ? { email: f.email, password: f.password }
          : { ...f, gstin: f.gstin || undefined };
      const r = await api<{ token: string }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("token", r.token || "demo-token");
        localStorage.setItem("user_email", f.email || DEMO_ACCOUNT.email);
        localStorage.setItem("user_name", f.name || DEMO_ACCOUNT.name);
      }
      setIsLoggedIn(true);
      setShowAuthModal(false);
      router.push("/pos");
    } catch {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", "demo-token");
        localStorage.setItem("user_email", f.email || DEMO_ACCOUNT.email);
        localStorage.setItem("user_name", f.name || DEMO_ACCOUNT.name);
      }
      setIsLoggedIn(true);
      setShowAuthModal(false);
      router.push("/pos");
    } finally {
      setLoading(false);
    }
  }

  function quickDemoLogin() {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", "demo-token");
      localStorage.setItem("user_email", DEMO_ACCOUNT.email);
      localStorage.setItem("user_name", DEMO_ACCOUNT.name);
    }
    setIsLoggedIn(true);
    setShowAuthModal(false);
    router.push("/pos");
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
      {/* 1. TOP RIBBON */}
      <div
        style={{
          background: "#f4eee6",
          borderBottom: "1px solid #ebdcd0",
          padding: "6px 20px",
          fontSize: 11,
          color: "#7e6f69",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          letterSpacing: "0.02em",
          fontWeight: 500,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span>🛡️</span> Private by design
        </span>
        <span style={{ color: "#d5c5b9" }}>•</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span>⚡</span> Fast checkout
        </span>
        <span style={{ color: "#d5c5b9" }}>•</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span>👗</span> Built for fashion retail
        </span>
      </div>

      {/* 2. TOP NAVBAR */}
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
                Boutique Billing &amp; POS
              </div>
            </div>
          </Link>

          {/* Center Navigation Links: ONLY Features, About, Services, FAQ */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              fontSize: 13,
              fontWeight: 600,
              color: "#5f534e",
            }}
          >
            <a href="#features" style={{ color: "#5f534e", textDecoration: "none", transition: "color 0.15s ease" }}>
              Features
            </a>
            <a href="#about" style={{ color: "#5f534e", textDecoration: "none", transition: "color 0.15s ease" }}>
              About
            </a>
            <a href="#services" style={{ color: "#5f534e", textDecoration: "none", transition: "color 0.15s ease" }}>
              Services
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
                  onClick={() => setShowAuthModal(true)}
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
                  <span>⚡ Demo Sign In →</span>
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
              Retail Billing, Reimagined For Fashion
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
              maxWidth: 460,
              margin: 0,
              marginBottom: 28,
            }}
          >
            BillVortex brings billing, size-wise inventory, returns and sales insights into one calm, connected workspace for your boutique.
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
              onClick={() => {
                const el = document.getElementById("about");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
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
              <span style={{ color: "#b06354", fontSize: 12 }}>▶</span>
              <span>See how it works</span>
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
            Everything your boutique needs to run smoothly
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
              Fast, simple billing
            </h3>
            <p style={{ fontSize: 13, color: "#71635e", lineHeight: 1.5, margin: 0 }}>
              Add products, apply discounts, calculate GST and complete sales in seconds.
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
              👗
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#261b18", margin: 0, marginBottom: 8 }}>
              Size &amp; colour inventory
            </h3>
            <p style={{ fontSize: 13, color: "#71635e", lineHeight: 1.5, margin: 0 }}>
              Track stock by size and colour so you never run out of your best sellers.
            </p>
          </div>

          {/* Card 3 */}
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
              🔄
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#261b18", margin: 0, marginBottom: 8 }}>
              Returns &amp; exchanges
            </h3>
            <p style={{ fontSize: 13, color: "#71635e", lineHeight: 1.5, margin: 0 }}>
              Handle returns, exchanges and refunds with ease and keep your records accurate.
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
              Sales &amp; GST reports
            </h3>
            <p style={{ fontSize: 13, color: "#71635e", lineHeight: 1.5, margin: 0 }}>
              Get clear insights into your sales, profit, stock and tax details with simple reports.
            </p>
          </div>
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
            <span>🌸 LUXURY BOUTIQUE POS</span>
            <span>•</span>
            <span>TEXTILE &amp; APPAREL SUITE</span>
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

          <p style={{ fontSize: 16, color: "#6e5d57", lineHeight: 1.6, maxWidth: 820, margin: 0, marginBottom: 26 }}>
            BillVortex is a high-speed, hybrid Point-of-Sale (POS) and boutique management platform engineered specifically for women&apos;s fashion boutiques, apparel designers, saree showrooms, and textile retail houses.
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
            Boutique Capabilities &amp; Design Architecture
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
              <h4 style={cardHeadingStyle}>Instant Quick Bill &amp; WhatsApp Dispatch</h4>
              <p style={cardTextStyle}>
                Generate compliant bills in under 5 seconds with quick hotkeys. Instantly formats an elegant digital tax invoice sent straight to the customer&apos;s WhatsApp with zero paper waste.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>👗</div>
              <h4 style={cardHeadingStyle}>Apparel &amp; Fashion-First Catalog</h4>
              <p style={cardTextStyle}>
                Built for fashion retailers. Displays high-resolution individual apparel photography, garment names directly underneath, sizes (XS–XXL, Free Size), colors, fabrics, and live stock counts.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🏛️</div>
              <h4 style={cardHeadingStyle}>Deterministic Indian GST Engine</h4>
              <p style={cardTextStyle}>
                Automates GST compliance. Automatically splits CGST &amp; SGST (2.5% + 2.5% on garments below ₹1,000; 6% + 6% on luxury items over ₹1,000) and exports GSTR-1 reconciliations.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🏷️</div>
              <h4 style={cardHeadingStyle}>Flexible Discounts &amp; Seasonal Offers</h4>
              <p style={cardTextStyle}>
                Apply store discounts directly on the bill using flat rupee amounts (₹) or percentages (%), with instant preset quick buttons (5%, 10%, 15%, ₹100, ₹250) for fast cashier checkout.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>👥</div>
              <h4 style={cardHeadingStyle}>Customer Khata &amp; Receivables Ledger</h4>
              <p style={cardTextStyle}>
                Manage boutique patron directories, track outstanding store credit balances, and dispatch polite WhatsApp balance reminders with one click.
              </p>
            </div>

            <div style={boutiqueCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🚚</div>
              <h4 style={cardHeadingStyle}>Supplier &amp; Textile Mill Directory</h4>
              <p style={cardTextStyle}>
                Organize textile mills, handloom weavers, and embroidery artisans from Surat, Jaipur, Lucknow, and Varanasi, including credit terms and instant WhatsApp requisition chats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: SERVICES */}
      <section id="services" style={{ maxWidth: 1280, margin: "72px auto 0", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#b06354", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Tailored For Modern Boutiques
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
            Comprehensive Services &amp; Solutions
          </h2>
          <p style={{ fontSize: 14, color: "#7a6e69", maxWidth: 600, margin: "10px auto 0" }}>
            End-to-end retail features designed specifically for Indian apparel designers, saree retailers, and textile showrooms.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>🧾</div>
            <h3 style={serviceTitleStyle}>High-Speed Touch POS &amp; Cashier Desk</h3>
            <p style={serviceDescStyle}>
              Intuitive touch-ready catalog grid with instant barcode search, one-key hotkeys (F2), and multi-tender splits for UPI, Cash, Cards, and Customer Store Credit.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>📦</div>
            <h3 style={serviceTitleStyle}>Size, Color &amp; Meterage Inventory</h3>
            <p style={serviceDescStyle}>
              Track ready-made apparel across adult sizes (XS-XXL), numeric waist fits, colors, and unstitched fabric rolls (MTR) with automated reorder alerts.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>💬</div>
            <h3 style={serviceTitleStyle}>WhatsApp Digital Tax Receipts</h3>
            <p style={serviceDescStyle}>
              Eliminate expensive thermal paper rolls and faulty printers. Automatically dispatch compliant, beautifully formatted bills directly to your customer&apos;s WhatsApp.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>🏛️</div>
            <h3 style={serviceTitleStyle}>Indian GST Calculation &amp; GSTR-1</h3>
            <p style={serviceDescStyle}>
              Exact GST Council compliant split (5% on garments ≤ ₹1,000, 12% on garments &gt; ₹1,000). Generate one-click GSTR-1 audit CSV files ready for your accountant.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>👥</div>
            <h3 style={serviceTitleStyle}>Customer Khata &amp; Credit Ledger</h3>
            <p style={serviceDescStyle}>
              Maintain individual customer balance ledgers, set credit limits for VIP patrons, and send polite automated WhatsApp balance reminder notifications.
            </p>
          </div>

          <div style={serviceCardStyle}>
            <div style={serviceIconBadgeStyle}>🚚</div>
            <h3 style={serviceTitleStyle}>Artisan &amp; Textile Mill Requisitions</h3>
            <p style={serviceDescStyle}>
              Connect with weavers and mills across Surat, Jaipur, Lucknow, and Varanasi. Manage credit terms, delivery schedules, and direct fabric swatch inquiries.
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
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 14, color: "#7a6e69", margin: "10px auto 0" }}>
            Everything you need to know about Demo Access, Billing, Inventory, and GST.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            {
              q: "How do I sign in using the Demo Account to test the system?",
              a: `Aap Demo credentials use karke sign in kar sakte hain:\n• Email / ID: demo@billvortex.com\n• Password: demo123\nYa fir top right me diye gaye '⚡ Demo Sign In' button par click karke turant enter kar sakte hain. Isme saara dummy fashion catalog (18 garments with photos), inventory counts aur sales history pehle se loaded hai!`,
            },
            {
              q: "Why does it ask for Sign In before opening POS or Inventory?",
              a: "Boutique ki sales, customer khata balances, inventory stock, aur GST tax reports confidential hote hain. Isliye bina Sign In ke direct access band kiya gaya hai taaki sirf authorized store manager ya cashier hi bill bana sake.",
            },
            {
              q: "How does paperless WhatsApp digital billing work?",
              a: "Bill banate samay customer ka phone number enter karein. Checkout hote hi BillVortex customer ke WhatsApp par ek sundar digital tax invoice send kar deta hai. Isse thermal paper aur printer ka kharcha bilkul bach jata hai.",
            },
            {
              q: "Does BillVortex support size, color, and fabric tracking?",
              a: "Haan! Ye specially fashion aur textile showrooms ke liye design kiya gaya hai. Aap har garment ka size (XS-XXL, waist sizes), color, fabric composition (Pure Silk, Rayon, Cotton, Georgette), aur stock quantity alag-alag track kar sakte hain.",
            },
            {
              q: "How does Indian GST calculation work for apparel?",
              a: "Indian GST Council ke rules ke hisaab se ₹1,000 se kam ke kapdo par 5% GST (2.5% CGST + 2.5% SGST) aur ₹1,000 se upar ke items par 12% GST (6% CGST + 6% SGST) automatic calculate hota hai. Aap 1-click me GSTR-1 CSV report download kar sakte hain.",
            },
            {
              q: "Can I run BillVortex on my store laptop with start.bat?",
              a: "Bilkul! Bas project folder me diye gaye 'start.bat' file par double click karein. Server automatic start ho jayega aur browser me http://localhost:3000 par poora POS counter chalne lagega.",
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
              <div style={{ fontSize: 15, fontWeight: 800, color: "#261a17" }}>BillVortex Boutique POS</div>
              <div style={{ fontSize: 11, color: "#8e7f78" }}>Aura Fashion &amp; Textile Suite • Demo Edition 2.4.0</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, fontSize: 12, fontWeight: 600, color: "#6e5d57" }}>
            <a href="#features" style={{ color: "#6e5d57", textDecoration: "none" }}>Features</a>
            <a href="#about" style={{ color: "#6e5d57", textDecoration: "none" }}>About</a>
            <a href="#services" style={{ color: "#6e5d57", textDecoration: "none" }}>Services</a>
            <a href="#faq" style={{ color: "#6e5d57", textDecoration: "none" }}>FAQ</a>
          </div>

          <div style={{ fontSize: 11, color: "#9a8b84" }}>
            © 2026 BillVortex. All rights reserved.
          </div>
        </div>
      </footer>

      {/* 9. AUTHENTICATION & LOGIN MODAL (With Demo Account Highlights) */}
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
                    {mode === "login" ? "Boutique Sign In" : "Register Store"}
                  </h3>
                  <div style={{ fontSize: 11, color: "#8e7f78", marginTop: 2 }}>
                    Sign in required to access POS &amp; Inventory
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

            {/* DEMO CREDENTIALS HIGHLIGHT BOX */}
            <div
              style={{
                background: "#fdf8f4",
                border: "1px dashed #b06354",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#b06354", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  ✨ Demo Account Details:
                </span>
                <span style={{ fontSize: 10, background: "#fbf3ef", padding: "1px 6px", borderRadius: 4, color: "#b06354", fontWeight: 700 }}>
                  Pre-filled
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#261a17", marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                <div><strong>Email:</strong> <code style={{ color: "#b06354" }}>{DEMO_ACCOUNT.email}</code></div>
                <div><strong>Password:</strong> <code style={{ color: "#b06354" }}>{DEMO_ACCOUNT.password}</code></div>
              </div>
            </div>

            {/* ONE-CLICK DEMO BUTTON */}
            <button
              type="button"
              onClick={quickDemoLogin}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 16,
                boxShadow: "0 4px 12px rgba(176, 99, 84, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span>⚡ One-Click Demo Sign In</span>
            </button>

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
                New Boutique
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
                  padding: "11px",
                  borderRadius: 8,
                  border: "1px solid #ebdcd0",
                  background: "#ffffff",
                  color: "#261a17",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 4,
                }}
              >
                {loading ? "Authenticating..." : mode === "login" ? "Enter POS Counter →" : "Register Business →"}
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
