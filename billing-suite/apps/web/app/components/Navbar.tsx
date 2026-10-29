"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    router.push("/");
  }

  const navItems = [
    { label: "Quick Bill", href: "/pos", icon: "⚡" },
    { label: "Stock & Inventory", href: "/inventory", icon: "📦" },
    { label: "Analytics", href: "/dashboard", icon: "📊" },
    { label: "Customer Ledger", href: "/customers", icon: "👥" },
  ];

  return (
    <header
      style={{
        flexShrink: 0,
        height: 52,
        background: "rgba(10, 15, 26, 0.95)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 50,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px rgba(16, 185, 129, 0.4)",
            fontWeight: 800,
            fontSize: 15,
            color: "#fff",
          }}
        >
          ⚡
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: "#fff" }}>BillVortex</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 4,
                background: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              PRO
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s ease",
                color: isActive ? "#fff" : "var(--text-muted)",
                background: isActive ? "rgba(16, 185, 129, 0.18)" : "transparent",
                border: isActive ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid transparent",
                boxShadow: isActive ? "0 0 12px rgba(16, 185, 129, 0.2)" : "none",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile & Fullscreen & Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen POS Mode"}
          style={{
            background: isFullscreen ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.06)",
            border: isFullscreen ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border-subtle)",
            color: isFullscreen ? "#34d399" : "var(--text-muted)",
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>{isFullscreen ? "↙ Exit Fullscreen" : "⛶ Fullscreen"}</span>
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            BV
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-main)" }}>Cashier</span>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          style={{
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.25)",
            color: "#fb7185",
            padding: "5px 10px",
            borderRadius: "var(--radius-sm)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
