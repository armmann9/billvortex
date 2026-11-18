"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../lib/api";
import {
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIERS_DATA,
  PurchaseOrderRecord,
  SupplierProfile,
} from "../../lib/demoData";
import Sidebar from "../components/Sidebar";

type Supplier = SupplierProfile;

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS_DATA);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>(INITIAL_PURCHASE_ORDERS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [reqSupplier, setReqSupplier] = useState<Supplier | null>(null);
  const [reqForm, setReqForm] = useState({ material: "", quantity: "50 MTR", amount: "45000", expectedDate: "In 4 days" });
  const [poToast, setPoToast] = useState("");
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    category: "Pure Silk & Brocade",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
    gstin: "",
    creditDays: "30",
    payable: "0",
    materials: "",
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/?login=true");
      return;
    }
  }, [router]);

  const categories = [
    "ALL",
    "Pure Silk & Brocade",
    "Cotton & Natural Dyes",
    "Embroidery & Zardozi",
    "Bridal & Heritage Silks",
    "Laces, Elastics & Trims",
    "South Silk Sarees",
  ];

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.materials.some((m) => m.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === "ALL" || s.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPayable = suppliers.reduce((sum, s) => sum + s.payable, 0);
  const totalYtdPurchases = suppliers.reduce((sum, s) => sum + s.ytdPurchases, 0);
  const pendingOrdersCount = purchaseOrders.filter((po) => po.status !== "Received").length;

  function openRequisitionModal(sup: Supplier) {
    setReqSupplier(sup);
    setReqForm({
      material: sup.materials[0] || sup.category,
      quantity: "40 PCS",
      amount: "48000",
      expectedDate: "In 4 days",
    });
  }

  function handleCreateRequisition(e: React.FormEvent) {
    e.preventDefault();
    if (!reqSupplier) return;
    const poNo = `PO-2611-${Math.floor(420 + Math.random() * 500)}`;
    const amt = Number(reqForm.amount) || 0;
    const newPo: PurchaseOrderRecord = {
      poNumber: poNo,
      supplierId: reqSupplier.id,
      supplierName: reqSupplier.name,
      material: reqForm.material,
      quantity: reqForm.quantity,
      amount: amt,
      orderDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      expectedDate: reqForm.expectedDate,
      status: "Confirmed",
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === reqSupplier.id
          ? { ...s, status: "Pending Orders", activePoNo: poNo, lastOrderDate: newPo.orderDate, payable: s.payable + amt }
          : s
      )
    );
    setPoToast(`Purchase Order ${poNo} created for ${reqSupplier.name} (₹${amt.toLocaleString("en-IN")}).`);
    setTimeout(() => setPoToast(""), 4500);
    setReqSupplier(null);
  }

  function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) return;

    const added: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplier.name,
      category: newSupplier.category,
      contactPerson: newSupplier.contactPerson || "Primary Contact",
      phone: newSupplier.phone,
      email: newSupplier.email || "vendor@partner.in",
      city: newSupplier.city || "India",
      gstin: newSupplier.gstin || "27ABCDE1234F1Z5",
      creditDays: Number(newSupplier.creditDays) || 30,
      payable: Number(newSupplier.payable) || 0,
      ytdPurchases: Number(newSupplier.payable) || 125000,
      onTimePct: 97,
      lastOrderDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      activePoNo: `PO-2611-${Math.floor(420 + Math.random() * 400)}`,
      status: "Active",
      rating: 4.9,
      materials: newSupplier.materials ? newSupplier.materials.split(",").map((m) => m.trim()) : ["Fabrics & Textiles"],
    };

    setSuppliers((prev) => [added, ...prev]);
    setShowAddModal(false);
    setNewSupplier({
      name: "",
      category: "Pure Silk & Brocade",
      contactPerson: "",
      phone: "",
      email: "",
      city: "",
      gstin: "",
      creditDays: "30",
      payable: "0",
      materials: "",
    });
  }

  function sendVendorWhatsApp(supplier: Supplier) {
    const cleanPhone = supplier.phone.replace(/\D/g, "");
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `🌸 Hello ${supplier.contactPerson} (${supplier.name}),\n\nThis is BillVortex Boutique Procurement team. Regarding our fabric requisition for ${supplier.materials.join(", ")}, please share the latest swatches, rate list, and stock availability.\n\nThank you!`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, "_blank");
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
                    Suppliers & Fabric Mills
                  </h1>
                  <p style={{ fontSize: 13, color: "#7a6e69", marginTop: 4 }}>
                    Textile mills, handloom weavers, embroidery artisans, lead times & payables
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
              <span>+ Add New Supplier</span>
            </button>
          </div>

          {/* 4 Summary Stat Mini-Cards */}
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
                Active Suppliers
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {suppliers.length} <span style={{ fontSize: 15, fontWeight: 600, color: "#7a6e69" }}>Vendors</span>
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                Direct weavers & textile mills
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
                Total Accounts Payable
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#b06354", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{totalPayable.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                Within agreed credit terms
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
                Orders in Dispatch
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {pendingOrdersCount} <span style={{ fontSize: 15, fontWeight: 600, color: "#7a6e69" }}>Shipments</span>
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                Expected within 3-5 days
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
                YTD Mill Procurement
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{(totalYtdPurchases / 100000).toFixed(1)}L
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                Avg 96.5% on-time dispatch SLA
              </div>
            </div>
          </div>

          {poToast && (
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
              ✓ {poToast}
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ebdcd0",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
            }}
          >
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 14,
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Search suppliers by mill name, city, contact person or fabric..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  background: "#fcf9f5",
                  border: "1px solid #ebdcd0",
                  borderRadius: 10,
                  color: "#261a17",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    background: selectedCategory === cat ? "#b06354" : "#ffffff",
                    color: selectedCategory === cat ? "#ffffff" : "#7a6e69",
                    border: selectedCategory === cat ? "1px solid #b06354" : "1px solid #ebdcd0",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Suppliers Table */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ebdcd0",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
            }}
          >
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
                    <th style={cell}>Vendor Name & Mill</th>
                    <th style={cell}>Specialty & Fabrics</th>
                    <th style={cell}>Location</th>
                    <th style={cell}>Contact & Phone</th>
                    <th style={cell}>GSTIN</th>
                    <th style={{ ...cell, textAlign: "right" }}>Balance Due</th>
                    <th style={{ ...cell, textAlign: "center" }}>Status</th>
                    <th style={{ ...cell, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      style={{
                        borderBottom: "1px solid #f3ece4",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ee")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={cell}>
                        <div style={{ fontWeight: 700, color: "#261a17", fontSize: 14 }}>{sup.name}</div>
                        <div style={{ fontSize: 11, color: "#b06354", marginTop: 2, fontWeight: 600 }}>
                          ★ {sup.rating} • {sup.onTimePct}% On-Time • YTD ₹{(sup.ytdPurchases / 100000).toFixed(1)}L
                        </div>
                      </td>

                      <td style={cell}>
                        <div style={{ color: "#261a17", fontWeight: 600 }}>{sup.category}</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                          {sup.materials.map((m, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "#fbf3ef",
                                color: "#b06354",
                                border: "1px solid #ebdcd0",
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td style={cell}>
                        <span style={{ color: "#7a6e69" }}>{sup.city}</span>
                      </td>

                      <td style={cell}>
                        <div style={{ color: "#261a17", fontWeight: 600 }}>{sup.contactPerson}</div>
                        <div style={{ fontSize: 12, color: "#7a6e69", marginTop: 2 }}>{sup.phone}</div>
                      </td>

                      <td style={cell}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            background: "#fcf9f5",
                            border: "1px solid #ebdcd0",
                            padding: "3px 6px",
                            borderRadius: 4,
                            color: "#64748b",
                          }}
                        >
                          {sup.gstin}
                        </span>
                      </td>

                      <td style={{ ...cell, textAlign: "right" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: sup.payable > 0 ? "#b06354" : "#16a34a",
                            fontSize: 14,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          ₹{sup.payable.toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontSize: 10, color: "#9a8b84", marginTop: 2 }}>
                          {sup.creditDays} days credit
                        </div>
                      </td>

                      <td style={{ ...cell, textAlign: "center" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              sup.status === "Active"
                                ? "#ecfdf5"
                                : sup.status === "Pending Orders"
                                ? "#fef3c7"
                                : "#fee2e2",
                            color:
                              sup.status === "Active"
                                ? "#047857"
                                : sup.status === "Pending Orders"
                                ? "#b45309"
                                : "#b91c1c",
                            border:
                              sup.status === "Active"
                                ? "1px solid #a7f3d0"
                                : sup.status === "Pending Orders"
                                ? "1px solid #fde68a"
                                : "1px solid #fecaca",
                          }}
                        >
                          {sup.status}
                        </span>
                      </td>

                      <td style={{ ...cell, textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            onClick={() => sendVendorWhatsApp(sup)}
                            title="Chat on WhatsApp"
                            style={{
                              padding: "6px 10px",
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#059669",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span>💬 WhatsApp</span>
                          </button>
                          <button
                            onClick={() => openRequisitionModal(sup)}
                            style={{
                              padding: "6px 10px",
                              background: "#ffffff",
                              border: "1px solid #ebdcd0",
                              color: "#7a6e69",
                              borderRadius: 6,
                              fontSize: 11,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            + Requisition
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "#9a8b84" }}>
                        No suppliers match your search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Purchase Orders & Incoming Shipments */}
          <div
            style={{
              marginTop: 24,
              background: "#ffffff",
              border: "1px solid #ebdcd0",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #ebdcd0", background: "#fcf9f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#261a17", margin: 0 }}>
                  Recent Purchase Orders &amp; Fabric Shipments
                </h3>
                <div style={{ fontSize: 12, color: "#7a6e69", marginTop: 2 }}>
                  Live procurement pipeline and mill dispatches
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#b06354", background: "#fbf3ef", padding: "4px 10px", borderRadius: 12, border: "1px solid #ebdcd0" }}>
                {purchaseOrders.length} Active POs
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#faf6f1", borderBottom: "1px solid #ebdcd0", color: "#7a6e69", fontSize: 11, textTransform: "uppercase" }}>
                    <th style={cell}>PO Number</th>
                    <th style={cell}>Supplier / Mill</th>
                    <th style={cell}>Material &amp; Lot</th>
                    <th style={cell}>Qty</th>
                    <th style={{ ...cell, textAlign: "right" }}>PO Value</th>
                    <th style={cell}>ETA</th>
                    <th style={{ ...cell, textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.poNumber} style={{ borderBottom: "1px solid #f3ece4" }}>
                      <td style={{ ...cell, fontWeight: 700, color: "#261a17" }}>
                        {po.poNumber}
                        <div style={{ fontSize: 10.5, color: "#8a7b75", fontWeight: 500 }}>{po.orderDate}</div>
                      </td>
                      <td style={{ ...cell, fontWeight: 600, color: "#261a17" }}>{po.supplierName}</td>
                      <td style={{ ...cell, color: "#5f534e" }}>{po.material}</td>
                      <td style={{ ...cell, fontWeight: 600 }}>{po.quantity}</td>
                      <td style={{ ...cell, textAlign: "right", fontWeight: 700, color: "#261a17" }}>
                        ₹{po.amount.toLocaleString("en-IN")}
                      </td>
                      <td style={{ ...cell, color: "#7a6e69", fontSize: 12 }}>{po.expectedDate}</td>
                      <td style={{ ...cell, textAlign: "center" }}>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: 12,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: po.status === "Received" ? "#ecfdf5" : "#fef3c7",
                            color: po.status === "Received" ? "#047857" : "#b45309",
                            border: po.status === "Received" ? "1px solid #a7f3d0" : "1px solid #fde68a",
                          }}
                        >
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Purchase Requisition Modal */}
          {reqSupplier && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(38, 26, 23, 0.45)",
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
                  width: 480,
                  maxWidth: "100%",
                  padding: 26,
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 18,
                  boxShadow: "0 20px 60px rgba(92, 57, 48, 0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontWeight: 700, color: "#261a17", margin: 0 }}>
                      Create Purchase Requisition
                    </h2>
                    <div style={{ fontSize: 11.5, color: "#7a6e69", marginTop: 2 }}>{reqSupplier.name} • {reqSupplier.city}</div>
                  </div>
                  <button
                    onClick={() => setReqSupplier(null)}
                    style={{ background: "transparent", border: "none", color: "#7a6e69", fontSize: 20, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateRequisition} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 5 }}>
                      Fabric / Material Description *
                    </label>
                    <input
                      required
                      value={reqForm.material}
                      onChange={(e) => setReqForm({ ...reqForm, material: e.target.value })}
                      style={modalInput}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 5 }}>
                        Order Quantity *
                      </label>
                      <input
                        required
                        value={reqForm.quantity}
                        onChange={(e) => setReqForm({ ...reqForm, quantity: e.target.value })}
                        style={modalInput}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 5 }}>
                        Estimated Value (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={reqForm.amount}
                        onChange={(e) => setReqForm({ ...reqForm, amount: e.target.value })}
                        style={modalInput}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 5 }}>
                      Expected Dispatch / Delivery
                    </label>
                    <input
                      value={reqForm.expectedDate}
                      onChange={(e) => setReqForm({ ...reqForm, expectedDate: e.target.value })}
                      style={modalInput}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setReqSupplier(null)}
                      style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ebdcd0", background: "#fff", color: "#7a6e69", fontWeight: 600, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1.4, padding: 10, borderRadius: 8, border: "none", background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                    >
                      Confirm Purchase Order
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Supplier Modal */}
          {showAddModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(38, 26, 23, 0.45)",
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
                  width: 580,
                  maxWidth: "100%",
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
                  <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#261a17", margin: 0 }}>
                    Add Textile Vendor / Supplier
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    style={{ background: "transparent", border: "none", color: "#7a6e69", fontSize: 20, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddSupplier} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 6 }}>
                      Mill / Supplier Name *
                    </label>
                    <input
                      required
                      placeholder="e.g. Surat Brocade Mills"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      style={modalInput}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 6 }}>
                        Category *
                      </label>
                      <select
                        value={newSupplier.category}
                        onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                        style={modalInput}
                      >
                        <option>Pure Silk & Brocade</option>
                        <option>Cotton & Natural Dyes</option>
                        <option>Embroidery & Zardozi</option>
                        <option>Bridal & Heritage Silks</option>
                        <option>Laces, Elastics & Trims</option>
                        <option>South Silk Sarees</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 6 }}>
                        Contact Person
                      </label>
                      <input
                        placeholder="e.g. Rajesh Kumar"
                        value={newSupplier.contactPerson}
                        onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                        style={modalInput}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 6 }}>
                        Mobile Phone / WhatsApp *
                      </label>
                      <input
                        required
                        placeholder="+91 98765 43210"
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                        style={modalInput}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 6 }}>
                        City & State
                      </label>
                      <input
                        placeholder="e.g. Surat, Gujarat"
                        value={newSupplier.city}
                        onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                        style={modalInput}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 6 }}>
                        GSTIN Number
                      </label>
                      <input
                        placeholder="24AAACS1234F1Z5"
                        value={newSupplier.gstin}
                        onChange={(e) => setNewSupplier({ ...newSupplier, gstin: e.target.value })}
                        style={modalInput}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 6 }}>
                        Credit Period (Days)
                      </label>
                      <input
                        type="number"
                        placeholder="30"
                        value={newSupplier.creditDays}
                        onChange={(e) => setNewSupplier({ ...newSupplier, creditDays: e.target.value })}
                        style={modalInput}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#7a6e69", fontWeight: 600, marginBottom: 6 }}>
                      Materials / Specialties (Comma-separated)
                    </label>
                    <input
                      placeholder="e.g. Chiffon, Georgette, Zari Rolls"
                      value={newSupplier.materials}
                      onChange={(e) => setNewSupplier({ ...newSupplier, materials: e.target.value })}
                      style={modalInput}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{
                        flex: 1,
                        padding: 10,
                        background: "#ffffff",
                        border: "1px solid #ebdcd0",
                        borderRadius: 8,
                        color: "#7a6e69",
                        cursor: "pointer",
                        fontWeight: 600,
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
                      Save Supplier
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

const modalInput = {
  width: "100%",
  padding: "10px 12px",
  background: "#fcf9f5",
  border: "1px solid #ebdcd0",
  borderRadius: 8,
  color: "#261a17",
  fontSize: 13,
  outline: "none",
};
