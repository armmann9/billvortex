"use client";

import { useEffect, useState } from "react";

interface TopBarProps {
  title?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  rightContent?: React.ReactNode;
}

export default function TopBar({
  title = "",
  showSearch = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search by product name, SKU, barcode, color...",
  rightContent,
}: TopBarProps) {
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
      setTimeStr(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        height: 56,
        flexShrink: 0,
        background: "#fcf9f5",
        borderBottom: "1px solid #ebdcd0",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Left Area: Title or Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, maxWidth: 540 }}>
        {title && (
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#261a17", margin: 0, whiteSpace: "nowrap" }}>
            {title}
          </h2>
        )}

        {showSearch && (
          <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8e7f78",
                fontSize: 13,
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 32px 8px 34px",
                borderRadius: 8,
                background: "#ffffff",
                border: "1px solid #e1cfbf",
                color: "#261a17",
                fontSize: 12,
                outline: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange?.("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#8e7f78",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Area: Store location, Cashier, Date, Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#6b5d56", fontWeight: 600 }}>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: "#f4ede5",
              border: "1px solid #e6d7c8",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>📍</span> Main Boutique
          </span>

          <span
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: "#f4ede5",
              border: "1px solid #e6d7c8",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>👤</span> Cashier: Jason Miller
          </span>

          <span
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: "#f4ede5",
              border: "1px solid #e6d7c8",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>📅</span> {dateStr} • {timeStr}
          </span>
        </div>

        {rightContent}
      </div>
    </header>
  );
}
