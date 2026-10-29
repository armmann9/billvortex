"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../lib/api";
import {
  SAMPLE_FASHION_PRODUCTS,
  CATEGORIES_MASTER,
  AGE_GROUPS,
  STYLE_ATTRIBUTES,
  FashionProductItem,
} from "../../lib/fashionCatalog";
import Sidebar from "../components/Sidebar";

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<FashionProductItem[]>(SAMPLE_FASHION_PRODUCTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "Indian Ethnic Wear",
    size: "M",
    color: "Blue",
    fabric: "Cotton",
    unit: "PCS" as "PCS" | "MTR",
    costPrice: "",
    salePrice: "",
    gstRate: "5",
    isFabric: false,
    stock: "20",
    lowStockThreshold: "5",
    ageGroup: "Adult",
    culture: "Indian Ethnic",
    occasion: "Daily Wear",
    fit: "Regular",
    pattern: "Solid",
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/?login=true");
      return;
    }
  }, [router]);

  function adjustStock(id: string, delta: number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item))
    );
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.salePrice) return;

    const newItem: FashionProductItem = {
      id: `p-${Date.now()}`,
      name: form.name,
      sku: form.sku.trim() || `W${form.category.slice(0, 2).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
      category: form.category,
      size: form.size,
      color: form.color,
      fabric: form.fabric,
      unit: form.unit,
      costPrice: form.costPrice || "0",
      salePrice: form.salePrice,
      mrp: Number(form.salePrice) || 0,
      gstRate: form.gstRate,
      isFabric: form.unit === "MTR",
      stock: Number(form.stock) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      ageGroup: form.ageGroup,
      culture: form.culture,
      occasion: form.occasion,
      fit: form.fit,
      pattern: form.pattern,
    };

    setItems((prev) => [newItem, ...prev]);
    setShowAddModal(false);
    setForm({
      name: "",
      sku: "",
      category: "Indian Ethnic Wear",
      size: "M",
      color: "Blue",
      fabric: "Cotton",
      unit: "PCS",
      costPrice: "",
      salePrice: "",
      gstRate: "5",
      isFabric: false,
      stock: "20",
      lowStockThreshold: "5",
      ageGroup: "Adult",
      culture: "Indian Ethnic",
      occasion: "Daily Wear",
      fit: "Regular",
      pattern: "Solid",
    });
  }

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.fabric.toLowerCase().includes(q) ||
      item.color.toLowerCase().includes(q) ||
      item.size.toLowerCase().includes(q);

    const isLow = item.stock <= item.lowStockThreshold;

    if (filter === "ALL") return matchesSearch;
    if (filter === "LOW_STOCK") return matchesSearch && isLow;
    if (filter === "ETHNIC") return matchesSearch && item.category.includes("Ethnic");
    if (filter === "WESTERN") return matchesSearch && item.category.includes("Western");
    if (filter === "FORMAL") return matchesSearch && item.category.includes("Formal");
    if (filter === "DRESSES") return matchesSearch && item.category.includes("Dress");
    return matchesSearch && item.category.toLowerCase().includes(filter.toLowerCase());
  });

  const totalStockVal = items.reduce((sum, item) => sum + item.stock * Number(item.salePrice || 0), 0);
  const totalUnits = items.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = items.filter((i) => i.stock <= i.lowStockThreshold).length;

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", background: "#faf7f2", color: "#261a17", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <main
          style={{
            flex: 1,
            padding: "24px 32px",
            maxWidth: 1440,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Header */}
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
                    Fashion Inventory & Stock Master
                  </h1>
                  <p style={{ fontSize: 13, color: "#7a6e69", marginTop: 4 }}>
                    Boutique apparel catalog • Sizes, Fabrics, Colors & Real-Time Stock Count
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 600,
                color: "#ffffff",
                background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                border: "none",
                borderRadius: 20,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(176, 99, 84, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>+ Add New Fashion Item</span>
            </button>
          </div>

          {/* 3 Metric Mini Cards */}
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
                Total Inventory Value
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{totalStockVal.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                Across {items.length} curated fashion SKUs
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
                Total Garments in Stock
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {totalUnits.toLocaleString("en-IN")} <span style={{ fontSize: 15, fontWeight: 600, color: "#7a6e69" }}>Pieces</span>
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                Active boutique merchandise
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
                Stock Status Alerts
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: lowStockCount > 0 ? "#b06354" : "#16a34a",
                  marginTop: 6,
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                {lowStockCount} {lowStockCount === 1 ? "Item" : "Items"} Critical
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                {lowStockCount > 0 ? "Supplier reorder recommended" : "All inventories well-stocked"}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ebdcd0",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
            }}
          >
            <div style={{ position: "relative", minWidth: 280, flex: 1, maxWidth: 450 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SKU, item name, fabric, color, size..."
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 36px",
                  fontSize: 13,
                  background: "#fcf9f5",
                  border: "1px solid #ebdcd0",
                  borderRadius: 10,
                  color: "#261a17",
                  outline: "none",
                }}
              />
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>
                🔍
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { id: "ALL", label: `All Items (${items.length})` },
                { id: "ETHNIC", label: "Ethnic Wear" },
                { id: "WESTERN", label: "Western Casual" },
                { id: "FORMAL", label: "Office & Formal" },
                { id: "DRESSES", label: "Dresses & Gowns" },
                { id: "LOW_STOCK", label: `⚠️ Low Stock (${lowStockCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: filter === tab.id ? "1px solid #b06354" : "1px solid #ebdcd0",
                    background: filter === tab.id ? "#b06354" : "#ffffff",
                    color: filter === tab.id ? "#ffffff" : "#7a6e69",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Items Table */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ebdcd0",
              borderRadius: 16,
              overflowX: "auto",
              boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fcf9f5", borderBottom: "1px solid #ebdcd0" }}>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>SKU & Garment</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Category</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Size</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Color</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Fabric</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Cost</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>MRP / Sale</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Stock</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#9a8b84" }}>
                      No inventory garments found matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.stock <= item.lowStockThreshold;
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #f3ece4",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ee")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={cell}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#261a17" }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: "#b06354", fontFamily: "var(--font-mono)", fontWeight: 700, marginTop: 2 }}>
                            {item.sku}
                          </div>
                        </td>

                        <td style={cell}>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "#fbf3ef",
                              color: "#b06354",
                              border: "1px solid #ebdcd0",
                              fontWeight: 600,
                            }}
                          >
                            {item.category}
                          </span>
                        </td>

                        <td style={cell}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 6,
                              background: "#f3f5f8",
                              color: "#334155",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {item.size}
                          </span>
                        </td>

                        <td style={cell}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: 6,
                              background: "#fbf5f2",
                              color: "#785244",
                              border: "1px solid #ebdcd0",
                            }}
                          >
                            {item.color}
                          </span>
                        </td>

                        <td style={cell}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: 6,
                              background: "#f8f5ee",
                              color: "#856637",
                              border: "1px solid #e7ded2",
                            }}
                          >
                            {item.fabric}
                          </span>
                        </td>

                        <td style={cell}>
                          <span style={{ fontSize: 13, color: "#7a6e69" }}>₹{item.costPrice}</span>
                        </td>

                        <td style={cell}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#261a17" }}>₹{item.salePrice}</span>
                          <div style={{ fontSize: 10, color: "#9a8b84" }}>+{item.gstRate}% GST</div>
                        </td>

                        <td style={cell}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: isLow ? "#b06354" : "#261a17",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {item.stock} {item.unit}
                            </span>
                            {isLow && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "#fde8e8",
                                  color: "#991b1b",
                                  border: "1px solid #fecaca",
                                }}
                              >
                                LOW
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ ...cell, textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 5 }}>
                            <button
                              onClick={() => adjustStock(item.id, -1)}
                              style={{
                                width: 28,
                                height: 28,
                                padding: 0,
                                fontSize: 13,
                                borderRadius: 6,
                                background: "#ffffff",
                                border: "1px solid #ebdcd0",
                                color: "#7a6e69",
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                              title="Decrease by 1"
                            >
                              -
                            </button>
                            <button
                              onClick={() => adjustStock(item.id, 5)}
                              style={{
                                padding: "0 8px",
                                height: 28,
                                fontSize: 11,
                                borderRadius: 6,
                                background: "#ffffff",
                                border: "1px solid #ebdcd0",
                                color: "#b06354",
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                              title="Restock +5"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => adjustStock(item.id, 10)}
                              style={{
                                padding: "0 8px",
                                height: 28,
                                fontSize: 11,
                                borderRadius: 6,
                                background: "#ffffff",
                                border: "1px solid #ebdcd0",
                                color: "#16a34a",
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                              title="Restock +10"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal for adding new fashion item */}
          {showAddModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(38, 26, 23, 0.45)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                padding: 20,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 580,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  padding: 28,
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 20,
                  boxShadow: "0 20px 60px rgba(92, 57, 48, 0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#261a17", margin: 0 }}>
                      Add New Fashion Garment
                    </h3>
                    <p style={{ fontSize: 12, color: "#7a6e69", margin: "4px 0 0" }}>
                      Curate inventory taxonomy for boutique POS catalog
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    style={{ background: "none", border: "none", color: "#7a6e69", cursor: "pointer", fontSize: 18 }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddItem} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                      Garment Name
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="e.g. Chanderi Silk Kurta Set"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 13,
                        background: "#fcf9f5",
                        border: "1px solid #ebdcd0",
                        borderRadius: 8,
                        color: "#261a17",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Product Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      >
                        {CATEGORIES_MASTER.map((c) => (
                          <option key={c.id} value={c.mainCategory}>
                            {c.id} - {c.mainCategory}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Age Group
                      </label>
                      <select
                        value={form.ageGroup}
                        onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      >
                        {AGE_GROUPS.map((a) => (
                          <option key={a.id} value={a.label}>
                            {a.label} ({a.suggestedRange})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        SKU Code
                      </label>
                      <input
                        value={form.sku}
                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                        placeholder="e.g. WET004"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Size
                      </label>
                      <select
                        value={form.size}
                        onChange={(e) => setForm({ ...form, size: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      >
                        <optgroup label="Adult Standard">
                          {STYLE_ATTRIBUTES.sizes.adult.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Numeric Waist">
                          {STYLE_ATTRIBUTES.sizes.numeric.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Kids Ages">
                          {STYLE_ATTRIBUTES.sizes.kids.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Color
                      </label>
                      <select
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      >
                        {STYLE_ATTRIBUTES.colors.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Fabric Type
                      </label>
                      <select
                        value={form.fabric}
                        onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      >
                        {STYLE_ATTRIBUTES.fabric.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Culture / Wear
                      </label>
                      <select
                        value={form.culture}
                        onChange={(e) => setForm({ ...form, culture: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      >
                        {STYLE_ATTRIBUTES.cultureWearType.map((cw) => (
                          <option key={cw} value={cw}>{cw}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Occasion
                      </label>
                      <select
                        value={form.occasion}
                        onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      >
                        {STYLE_ATTRIBUTES.occasion.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Cost Price (₹)
                      </label>
                      <input
                        type="number"
                        value={form.costPrice}
                        onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                        placeholder="650"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={form.salePrice}
                        onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                        placeholder="1299"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        GST Rate %
                      </label>
                      <select
                        value={form.gstRate}
                        onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      >
                        <option value="5">5% (Apparel &lt; ₹1,000)</option>
                        <option value="12">12% (Apparel &gt; ₹1,000)</option>
                        <option value="18">18% (Accessories)</option>
                        <option value="0">0% (Exempt)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Initial Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        value={form.lowStockThreshold}
                        onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          background: "#fcf9f5",
                          border: "1px solid #ebdcd0",
                          borderRadius: 8,
                          color: "#261a17",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{
                        flex: 1,
                        padding: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        background: "#ffffff",
                        border: "1px solid #ebdcd0",
                        color: "#7a6e69",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#ffffff",
                        background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Save to Catalog
                    </button>
                  </div>
                </form>
              </div>
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
