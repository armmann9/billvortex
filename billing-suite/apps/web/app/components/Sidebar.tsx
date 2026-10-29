"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navSections = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "📊", badge: "" },
    ],
  },
  {
    group: "Sales & Billing",
    items: [
      { label: "Quick Bill (POS)", href: "/pos", icon: "🧾", badge: "HOT" },
      { label: "Billing History", href: "/reports", icon: "📋", badge: "" },
    ],
  },
  {
    group: "Inventory",
    items: [
      { label: "Stock & Items", href: "/inventory", icon: "📦", badge: "" },
      { label: "Fabric Suppliers", href: "/suppliers", icon: "🚚", badge: "" },
    ],
  },
  {
    group: "Customers",
    items: [
      { label: "Customer Khata", href: "/customers", icon: "👥", badge: "" },
    ],
  },
  {
    group: "Analytics",
    items: [
      { label: "GST & Tax Reports", href: "/reports", icon: "🏛️", badge: "" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "About Suite", href: "/about", icon: "✨", badge: "" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleSection(group: string) {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    router.push("/");
  }

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        height: "100vh",
        background: "#fcf9f5",
        borderRight: "1px solid #ebdcd0",
        display: "flex",
        flexDirection: "column",
        padding: 0,
        overflow: "hidden",
        flexShrink: 0,
        zIndex: 40,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: "16px 16px 14px",
          borderBottom: "1px solid #ebdcd0",
          background: "#faf5ef",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #b06354 0%, #8e473a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(176, 99, 84, 0.25)",
              fontSize: 16,
              color: "#fff",
            }}
          >
            🌸
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#261a17",
                  letterSpacing: "-0.02em",
                }}
              >
                BillVortex
              </span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: "rgba(176, 99, 84, 0.12)",
                  color: "#b06354",
                  border: "1px solid rgba(176, 99, 84, 0.25)",
                }}
              >
                POS
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#8b7c76",
                marginTop: 1,
                fontWeight: 600,
              }}
            >
              Boutique Billing &amp; Retail
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {navSections.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 4 }}>
            {section.group && (
              <button
                onClick={() => toggleSection(section.group!)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "4px 8px",
                  marginBottom: 2,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#8e7f78",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                <span>{section.group}</span>
                <span
                  style={{
                    fontSize: 8,
                    transition: "transform 0.2s",
                    transform: collapsed[section.group!] ? "rotate(-90deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </button>
            )}

            {!collapsed[section.group || ""] &&
              section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      background: isActive ? "#b06354" : "transparent",
                      color: isActive ? "#ffffff" : "#5d4e47",
                      boxShadow: isActive ? "0 2px 8px rgba(176, 99, 84, 0.3)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: isActive ? "rgba(255,255,255,0.25)" : "rgba(176, 99, 84, 0.12)",
                          color: isActive ? "#ffffff" : "#b06354",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid #ebdcd0",
          background: "#faf5ef",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#b06354",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            DM
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#261a17" }}>Demo Manager</div>
            <div style={{ fontSize: 10, color: "#8e7f78" }}>demo@billvortex.com</div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out (Logout)"
          style={{
            background: "transparent",
            border: "none",
            color: "#8e7f78",
            cursor: "pointer",
            fontSize: 14,
            padding: 4,
          }}
        >
          ⎋
        </button>
      </div>
    </aside>
  );
}
