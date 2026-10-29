"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../lib/api";
import Sidebar from "../components/Sidebar";

type Supplier = {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  gstin: string;
  creditDays: number;
  payable: number;
  status: "Active" | "Pending Orders" | "On Hold";
  rating: number;
  materials: string[];
};

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    name: "Surat Silk Mills & Weavers",
    category: "Pure Silk & Brocade",
    contactPerson: "Rajeshbhai Patel",
    phone: "+91 98251 44520",
    email: "orders@suratsilkmills.in",
    city: "Surat, Gujarat",
    gstin: "24AAACS1234F1Z5",
    creditDays: 30,
    payable: 145000,
    status: "Active",
    rating: 4.9,
    materials: ["Banarasi Silk", "Chanderi Fabric", "Zari Borders"],
  },
  {
    id: "sup-2",
    name: "Jaipur Handblock Tex",
    category: "Cotton & Natural Dyes",
    contactPerson: "Mahesh Sharma",
    phone: "+91 94140 88219",
    email: "mahesh@jaipurhandblock.com",
    city: "Jaipur, Rajasthan",
    gstin: "08BBAPJ8765E1Z3",
    creditDays: 45,
    payable: 68500,
    status: "Active",
    rating: 4.8,
    materials: ["Bagru Print Cotton", "Mulmul Muslin", "Dabu Indigo"],
  },
  {
    id: "sup-3",
    name: "Lucknow Chikan Artisans Guild",
    category: "Embroidery & Zardozi",
    contactPerson: "Shabana Begum",
    phone: "+91 91980 33412",
    email: "guild@lucknowchikan.org",
    city: "Lucknow, Uttar Pradesh",
    gstin: "09CCAPL4321D1Z1",
    creditDays: 30,
    payable: 32000,
    status: "Pending Orders",
    rating: 4.9,
    materials: ["Bakhiya Threadwork", "Tepchi Kurtas", "Mukaish Work"],
  },
  {
    id: "sup-4",
    name: "Varanasi Heritage Handlooms",
    category: "Bridal & Heritage Silks",
    contactPerson: "Anand Upadhyay",
    phone: "+91 94500 12890",
    email: "anand@varanasiheritage.co",
    city: "Varanasi, UP",
    gstin: "09DDEPV9876C1Z9",
    creditDays: 60,
    payable: 210000,
    status: "Active",
    rating: 5.0,
    materials: ["Katan Silk Sarees", "Real Gold Zari", "Tanchoi Brocade"],
  },
  {
    id: "sup-5",
    name: "Surat Laces & Trims Corp",
    category: "Laces, Elastics & Trims",
    contactPerson: "Kirit Vora",
    phone: "+91 98980 77123",
    email: "sales@suratlaces.in",
    city: "Surat, Gujarat",
    gstin: "24EEAPL6543B1Z7",
    creditDays: 21,
    payable: 18400,
    status: "Active",
    rating: 4.6,
    materials: ["Gota Patti Ribbons", "Sequin Latkans", "Velvet Pipings"],
  },
  {
    id: "sup-6",
    name: "Kanchipuram Weaver Society",
    category: "South Silk Sarees",
    contactPerson: "K. Ramanathan",
    phone: "+91 94440 99876",
    email: "info@kanchisociety.tn.gov",
    city: "Kanchipuram, TN",
    gstin: "33FFAPK1122A1Z4",
    creditDays: 30,
    payable: 95000,
    status: "Pending Orders",
    rating: 4.9,
    materials: ["Pure Mulberry Silk", "Korvai Weaving", "Temple Borders"],
  },
];

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
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
  const pendingOrdersCount = suppliers.filter((s) => s.status === "Pending Orders").length;

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
      status: "Active",
      rating: 5.0,
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
                Average Credit Period
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                35 Days
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                Standard 0% interest vendor credit
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
                        <div style={{ fontSize: 11, color: "#b06354", marginTop: 2, fontWeight: 600 }}>★ {sup.rating} Rating</div>
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
                            onClick={() => alert(`Purchase Order draft initiated for ${sup.name}`)}
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
