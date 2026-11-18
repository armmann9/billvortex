"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../lib/api";
import { CustomerProfile, INITIAL_CUSTOMERS } from "../../lib/demoData";
import Sidebar from "../components/Sidebar";

type Customer = CustomerProfile;

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "DUE" | "PAID">("ALL");

  // New customer quick-add state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "", email: "", balance: "0" });

  useEffect(() => {
    if (!getToken()) {
      router.push("/?login=true");
      return;
    }
    try {
      const saved = localStorage.getItem("billvortex_customers_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setCustomers(parsed);
      }
    } catch {}
  }, [router]);

  function persistCustomers(next: Customer[]) {
    setCustomers(next);
    try {
      localStorage.setItem("billvortex_customers_v1", JSON.stringify(next));
    } catch {}
  }

  function settleBalance(id: string) {
    const next = customers.map((c) =>
      c.id === id ? { ...c, balance: "0", status: "Paid" as const } : c
    );
    persistCustomers(next);
  }

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    const isDue = Number(c.balance) > 0;
    if (filter === "DUE") return matchesSearch && isDue;
    if (filter === "PAID") return matchesSearch && !isDue;
    return matchesSearch;
  });

  const totalReceivables = customers.reduce((sum, c) => sum + Number(c.balance || 0), 0);
  const dueCount = customers.filter((c) => Number(c.balance) > 0).length;

  function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCust.name.trim()) return;

    const added: Customer = {
      id: `c-${Date.now()}`,
      name: newCust.name,
      phone: newCust.phone || "+91 98200 00000",
      email: newCust.email || "customer@store.in",
      city: "Mumbai",
      type: "Regular Patron",
      totalVisits: 1,
      lifetimeSpend: Number(newCust.balance) || 0,
      lastVisit: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      balance: newCust.balance || "0",
      status: Number(newCust.balance) > 0 ? "Due" : "Paid",
    };

    persistCustomers([added, ...customers]);
    setShowAddModal(false);
    setNewCust({ name: "", phone: "", email: "", balance: "0" });
  }

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
          {/* Header Title & Actions */}
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
                    Customer Ledger & Receivables
                  </h1>
                  <p style={{ fontSize: 13, color: "#7a6e69", marginTop: 4 }}>
                    Track client balances, contact profiles, and WhatsApp billing reminders
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
              <span>+ Add New Customer</span>
            </button>
          </div>

          {/* 3 Summary Stat Mini-Cards */}
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
                Total Ledger Receivables
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#b06354", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₹{totalReceivables.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                Outstanding dues across customer book
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
                Overdue Accounts
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {dueCount} <span style={{ fontSize: 15, fontWeight: 600, color: "#7a6e69" }}>Clients</span>
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                {dueCount > 0 ? "Follow-ups pending" : "All accounts clear"}
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
                Total Registered Accounts
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#261a17", marginTop: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {customers.length} <span style={{ fontSize: 15, fontWeight: 600, color: "#7a6e69" }}>Profiles</span>
              </div>
              <div style={{ fontSize: 12, color: "#9a8b84", marginTop: 4 }}>
                Active boutique patron directory
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
                placeholder="Search by customer name, phone, or email..."
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

            <div style={{ display: "flex", gap: 8 }}>
              {(["ALL", "DUE", "PAID"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: filter === tab ? "1px solid #b06354" : "1px solid #ebdcd0",
                    background: filter === tab ? "#b06354" : "#ffffff",
                    color: filter === tab ? "#ffffff" : "#7a6e69",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab === "ALL" && "All Accounts"}
                  {tab === "DUE" && "⏳ Outstanding Dues"}
                  {tab === "PAID" && "✓ Settled / Zero Balance"}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ebdcd0",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fcf9f5", borderBottom: "1px solid #ebdcd0" }}>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Customer Profile</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Contact Details</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Status</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>Outstanding Balance</th>
                  <th style={{ ...cell, color: "#7a6e69", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 48, textAlign: "center", color: "#9a8b84" }}>
                      No customer accounts found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const isDue = Number(c.balance) > 0;
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: "1px solid #f3ece4",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ee")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={cell}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                background: "linear-gradient(135deg, #fbf3ef 0%, #ede3d8 100%)",
                                border: "1px solid #ebdcd0",
                                color: "#b06354",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#261a17" }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: "#7a6e69", marginTop: 2 }}>
                                <span style={{ color: "#b06354", fontWeight: 700 }}>{c.type}</span> • {c.city} • {c.totalVisits} visits • Lifetime ₹{c.lifetimeSpend.toLocaleString("en-IN")}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={cell}>
                          <div style={{ fontSize: 13, color: "#261a17", fontWeight: 600 }}>{c.phone || "—"}</div>
                          <div style={{ fontSize: 11, color: "#7a6e69" }}>{c.email || "No email on record"}</div>
                        </td>

                        <td style={cell}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: isDue ? "#fef3c7" : "#ecfdf5",
                              color: isDue ? "#b45309" : "#047857",
                              border: isDue ? "1px solid #fde68a" : "1px solid #a7f3d0",
                            }}
                          >
                            {c.status}
                          </span>
                        </td>

                        <td style={{ ...cell, textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: isDue ? "#b06354" : "#16a34a",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            ₹{Number(c.balance).toLocaleString("en-IN")}
                          </div>
                        </td>

                        <td style={{ ...cell, textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                            {isDue && (
                              <button
                                onClick={() => settleBalance(c.id)}
                                title="Mark Outstanding Balance as Paid"
                                style={{
                                  padding: "6px 10px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: "#faf6f1",
                                  border: "1px solid #ebdcd0",
                                  color: "#261a17",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                }}
                              >
                                ✓ Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (c.phone) {
                                  const clean = c.phone.replace(/\D/g, "");
                                  const msg = `Dear ${c.name},\n\nThis is a polite reminder from BillVortex Store Accounts. Your current Khata ledger balance is Rs. ${Number(c.balance).toLocaleString("en-IN")}. Kindly settle at your convenience.\n\nWarm regards,\nBillVortex Billing Desk`;
                                  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, "_blank");
                                }
                              }}
                              style={{
                                padding: "6px 12px",
                                fontSize: 11,
                                fontWeight: 600,
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                color: "#059669",
                                borderRadius: 8,
                                cursor: "pointer",
                              }}
                            >
                              💬 WhatsApp Reminder
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

          {/* Modal for adding new customer */}
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
                  maxWidth: 440,
                  padding: 28,
                  background: "#ffffff",
                  border: "1px solid #ebdcd0",
                  borderRadius: 20,
                  boxShadow: "0 20px 60px rgba(92, 57, 48, 0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#261a17", margin: 0 }}>
                    Add Customer Profile
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    style={{ background: "none", border: "none", color: "#7a6e69", cursor: "pointer", fontSize: 18 }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddCustomer} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#7a6e69", fontWeight: 600, display: "block", marginBottom: 6 }}>
                      Full Name / Client Name
                    </label>
                    <input
                      value={newCust.name}
                      onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                      required
                      placeholder="e.g. Mahaveer Textiles / Pooja Sharma"
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
                      Phone Number (WhatsApp)
                    </label>
                    <input
                      value={newCust.phone}
                      onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                      placeholder="+91 98765 00000"
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
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={newCust.email}
                      onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                      placeholder="client@example.com"
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
                      Initial Ledger Balance (₹)
                    </label>
                    <input
                      type="number"
                      value={newCust.balance}
                      onChange={(e) => setNewCust({ ...newCust, balance: e.target.value })}
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
                      Save Customer
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
