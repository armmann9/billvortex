"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "../../lib/api";
import {
  SAMPLE_FASHION_PRODUCTS,
  FashionProductItem,
} from "../../lib/fashionCatalog";
import { loadInventoryItems, saveInventoryItems } from "../../lib/demoData";
import {
  InvoiceReceiptData,
  buildReceiptShareUrl,
  canNativeSharePdf,
  downloadReceiptPdf,
  previewReceiptPdf,
  sendPdfReceiptViaWhatsApp,
  shareReceiptPdfNative,
} from "../../lib/pdfReceipt";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

type CartLine = {
  product: FashionProductItem;
  quantity: string;
  discountPct: string;
};

type Method = "CASH" | "UPI" | "CARD" | "CREDIT";

export default function QuickBillPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FashionProductItem[]>([]);
  const [catalog, setCatalog] = useState<FashionProductItem[]>(SAMPLE_FASHION_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [method, setMethod] = useState<Method>("UPI");
  const [customerPhone, setCustomerPhone] = useState("+91 98765 43210");
  const [customerName, setCustomerName] = useState("Pooja Sharma");
  const [autoWhatsApp, setAutoWhatsApp] = useState(true);

  // Bill-Level Discount Feature
  const [billDiscountType, setBillDiscountType] = useState<"PCT" | "FLAT">("PCT");
  const [billDiscountValue, setBillDiscountValue] = useState<string>("");

  const [lastInvoice, setLastInvoice] = useState<InvoiceReceiptData | null>(null);

  const [showBillModal, setShowBillModal] = useState(false);
  const [pdfNotice, setPdfNotice] = useState("");
  const [receiptShareLink, setReceiptShareLink] = useState("");
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);
  const [msg, setMsg] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);

  const idemKey = useRef(crypto.randomUUID());
  const searchInput = useRef<HTMLInputElement>(null);

  // Synthesized Barcode Beep Audio Tone
  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }, []);

  useEffect(() => {
    setSupportsNativeShare(canNativeSharePdf());
    if (!getToken()) {
      router.push("/?login=true");
      return;
    }
    searchInput.current?.focus();
    setCatalog(loadInventoryItems());
    api<FashionProductItem[]>("/products")
      .then((res) => {
        if (res && res.length) {
          const localStock = loadInventoryItems();
          const merged = res.map((item) => {
            const localMatch = localStock.find((l) => l.id === item.id || l.sku === item.sku);
            const match = SAMPLE_FASHION_PRODUCTS.find((s) => s.id === item.id || s.name === item.name);
            return {
              ...item,
              imageUrl: match?.imageUrl || item.imageUrl,
              stock: localMatch ? localMatch.stock : item.stock,
            };
          });
          setCatalog(merged);
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim()) {
        const needle = q.toLowerCase();
        const matched = catalog.filter(
          (item) =>
            item.name.toLowerCase().includes(needle) ||
            item.sku.toLowerCase().includes(needle) ||
            item.category.toLowerCase().includes(needle) ||
            item.fabric.toLowerCase().includes(needle)
        );
        setResults(matched);
      } else {
        setResults([]);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [q, catalog]);

  function add(p: FashionProductItem) {
    playBeep();
    setCart((c) => {
      const idx = c.findIndex((x) => x.product.id === p.id);
      if (idx >= 0 && !p.isFabric) {
        const next = [...c];
        next[idx] = { ...next[idx], quantity: String(Number(next[idx].quantity) + 1) };
        return next;
      }
      return [...c, { product: p, quantity: "1", discountPct: "" }];
    });
    setQ("");
    setResults([]);
    searchInput.current?.focus();
  }

  function updateQuantity(idx: number, val: string) {
    const num = Math.max(0, Number(val) || 0);
    if (num === 0 && val !== "") {
      removeLine(idx);
      return;
    }
    setCart((c) => c.map((item, i) => (i === idx ? { ...item, quantity: val } : item)));
  }

  function adjustQuantity(idx: number, delta: number) {
    setCart((c) => {
      const current = Number(c[idx]?.quantity || 1);
      const nextQty = Math.max(0, current + delta);
      if (nextQty === 0) {
        return c.filter((_, i) => i !== idx);
      }
      return c.map((item, i) => (i === idx ? { ...item, quantity: String(nextQty) } : item));
    });
  }

  function updateDiscount(idx: number, val: string) {
    setCart((c) => c.map((item, i) => (i === idx ? { ...item, discountPct: val } : item)));
  }

  function removeLine(idx: number) {
    setCart((c) => c.filter((_, i) => i !== idx));
  }

  function clearCart() {
    setCart([]);
    setBillDiscountValue("");
    searchInput.current?.focus();
  }

  // Financial calculations with Bill-Level and Item-Level discounts
  const { subtotal, lineDiscountTotal, billDiscountAmount, totalDiscount, estimatedTax, grandTotal } = useMemo(() => {
    let sub = 0;
    let lineDisc = 0;

    cart.forEach((line) => {
      const price = Number(line.product.salePrice) || 0;
      const qty = Number(line.quantity) || 0;
      const lineSub = price * qty;
      const lDisc = lineSub * ((Number(line.discountPct) || 0) / 100);
      sub += lineSub;
      lineDisc += lDisc;
    });

    const netAfterLineDisc = Math.max(0, sub - lineDisc);
    let billDisc = 0;
    const discInput = Number(billDiscountValue) || 0;
    if (discInput > 0) {
      if (billDiscountType === "PCT") {
        billDisc = netAfterLineDisc * (Math.min(100, discInput) / 100);
      } else {
        billDisc = Math.min(netAfterLineDisc, discInput);
      }
    }

    const totalDisc = lineDisc + billDisc;
    const taxable = Math.max(0, sub - totalDisc);

    let tax = 0;
    if (sub > 0) {
      const taxRatio = taxable / sub;
      cart.forEach((line) => {
        const lineSub = (Number(line.product.salePrice) || 0) * (Number(line.quantity) || 0);
        const effectiveLineTaxable = lineSub * taxRatio;
        tax += effectiveLineTaxable * ((Number(line.product.gstRate) || 0) / 100);
      });
    }

    return {
      subtotal: sub,
      lineDiscountTotal: lineDisc,
      billDiscountAmount: billDisc,
      totalDiscount: totalDisc,
      taxableTotal: taxable,
      estimatedTax: tax,
      grandTotal: taxable + tax,
    };
  }, [cart, billDiscountType, billDiscountValue]);

  // Send formal PDF receipt link via WhatsApp (no auto-download clutter on Desktop!)
  const handleSendPdfWhatsApp = useCallback((invoiceData: InvoiceReceiptData) => {
    const { receiptUrl } = sendPdfReceiptViaWhatsApp(invoiceData);
    setReceiptShareLink(receiptUrl);
    setPdfNotice(
      `Formal PDF receipt link opened in WhatsApp for ${invoiceData.customerName} — no file downloaded to your PC.`
    );
  }, []);

  // Native OS share sheet (attaches PDF file directly on mobile/tablet/supported desktop)
  const handleNativeSharePdf = useCallback(async (invoiceData: InvoiceReceiptData) => {
    try {
      const shared = await shareReceiptPdfNative(invoiceData);
      if (shared) {
        setPdfNotice(`Formal PDF receipt shared for ${invoiceData.number}.`);
      }
    } catch (err) {
      // User cancelled share sheet; ignore AbortError
      if ((err as Error)?.name !== "AbortError") {
        handleSendPdfWhatsApp(invoiceData);
      }
    }
  }, [handleSendPdfWhatsApp]);

  const handleDownloadPdf = useCallback((invoiceData: InvoiceReceiptData) => {
    const fileName = downloadReceiptPdf(invoiceData);
    setPdfNotice(`Formal PDF receipt saved as "${fileName}".`);
  }, []);

  // Checkout function - Instantly opens Bill & sends formal PDF receipt
  const checkout = useCallback(async () => {
    if (!cart.length) return;
    setMsg("");
    setPdfNotice("");
    setIsCheckingOut(true);

    try {
      let invNumber = `INV-${Date.now().toString().slice(-6)}`;
      try {
        const inv = await api<{ number: string; grandTotal: string }>("/invoices", {
          method: "POST",
          idempotencyKey: idemKey.current,
          body: JSON.stringify({
            lines: cart.map((l) => ({
              productId: l.product.id,
              quantity: l.quantity,
              ...(l.discountPct ? { discountPct: l.discountPct } : {}),
            })),
            customerPhone: customerPhone || undefined,
            payFullWith: method === "CREDIT" ? "CASH" : method,
          }),
        });
        if (inv?.number) invNumber = inv.number;
      } catch {}

      const invoicedItems = cart.map((l) => ({
        name: l.product.name,
        sku: l.product.sku,
        size: l.product.size,
        color: l.product.color,
        fabric: l.product.fabric,
        qty: l.quantity,
        rate: l.product.salePrice,
        total: (Number(l.product.salePrice) || 0) * (Number(l.quantity) || 1) * (1 - (Number(l.discountPct) || 0) / 100),
      }));

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const gTotalStr = grandTotal.toFixed(2);
      const subTotStr = subtotal.toFixed(2);
      const taxStr = estimatedTax.toFixed(2);
      const discStr = totalDiscount.toFixed(2);

      const invoiceData: InvoiceReceiptData = {
        number: invNumber,
        grandTotal: gTotalStr,
        subtotal: subTotStr,
        tax: taxStr,
        discount: discStr,
        method,
        date: dateStr,
        time: timeStr,
        customerName: customerName || "Walk-in Buyer",
        customerPhone: customerPhone || "",
        items: invoicedItems,
      };

      setLastInvoice(invoiceData);
      setReceiptShareLink(buildReceiptShareUrl(invoiceData));

      // Save to localStorage for live Dashboard & Billing History synchronisation
      try {
        const existing = JSON.parse(localStorage.getItem("aura_sales_history") || "[]");
        existing.unshift({ ...invoiceData, daysAgo: 0, branch: "Bandra Flagship" });
        localStorage.setItem("aura_sales_history", JSON.stringify(existing.slice(0, 100)));
      } catch {}

      // Deduct sold stock live and sync with Stock & Sales
      setCatalog((prev) => {
        const updated = prev.map((prod) => {
          const soldQty = cart
            .filter((l) => l.product.id === prod.id)
            .reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
          return soldQty > 0 ? { ...prod, stock: Math.max(0, prod.stock - soldQty) } : prod;
        });
        saveInventoryItems(updated);
        return updated;
      });

      // Open Bill Modal
      setShowBillModal(true);

      // Auto-generate formal PDF receipt & launch WhatsApp
      if (autoWhatsApp && customerPhone.trim()) {
        handleSendPdfWhatsApp(invoiceData);
      }

      setCart([]);
      setBillDiscountValue("");
      setShowUpiModal(false);
      idemKey.current = crypto.randomUUID();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setIsCheckingOut(false);
    }
  }, [cart, customerPhone, customerName, method, grandTotal, subtotal, estimatedTax, totalDiscount, autoWhatsApp, handleSendPdfWhatsApp]);

  // Keyboard Hotkeys: F2 (Issue), Esc (Clear)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        checkout();
      } else if (e.key === "Escape") {
        if (showBillModal) setShowBillModal(false);
        else if (showUpiModal) setShowUpiModal(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [checkout, showBillModal, showUpiModal]);

  // Print Thermal Slip
  function printThermalSlip() {
    if (!lastInvoice) return;
    const tableRows = lastInvoice.items
      .map(
        (it) => `
        <tr>
          <td style="padding: 4px 0;">
            <div style="font-weight: 600;">${it.name}</div>
            <div style="font-size: 11px; color: #666;">${it.size} | ${it.color} | ${it.fabric}</div>
          </td>
          <td style="padding: 4px 0; text-align: center;">${it.qty}</td>
          <td style="padding: 4px 0; text-align: right;">₹${it.rate}</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600;">₹${it.total.toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${lastInvoice.number}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 340px; margin: 0 auto; padding: 16px; color: #111; }
            .center { text-align: center; }
            .header { margin-bottom: 12px; border-bottom: 1px dashed #444; padding-bottom: 8px; }
            .title { font-size: 18px; font-weight: bold; }
            .subtitle { font-size: 11px; color: #555; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
            th { text-align: left; border-bottom: 1px dashed #444; padding-bottom: 4px; font-size: 11px; }
            .total-section { border-top: 1px dashed #444; padding-top: 8px; margin-top: 8px; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 6px 0; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header center">
            <div class="title">BILLVORTEX BOUTIQUE</div>
            <div class="subtitle">Boutique & Designer Apparel Suite</div>
            <div class="subtitle">GSTIN: 27AABCA1234F1Z5 • Phone: +91 98200 12345</div>
          </div>
          <div class="row"><span>Bill No:</span><span><b>${lastInvoice.number}</b></span></div>
          <div class="row"><span>Date:</span><span>${lastInvoice.date} ${lastInvoice.time}</span></div>
          <div class="row"><span>Customer:</span><span>${lastInvoice.customerName}</span></div>
          <div class="row"><span>Phone:</span><span>${lastInvoice.customerPhone}</span></div>
          <div class="row"><span>Payment:</span><span><b>${lastInvoice.method}</b></span></div>
          <table>
            <thead><tr><th>Item</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Rate</th><th style="text-align: right;">Amt</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="total-section">
            <div class="row"><span>Subtotal:</span><span>₹${lastInvoice.subtotal}</span></div>
            ${Number(lastInvoice.discount) > 0 ? `<div class="row" style="color: #c00;"><span>Discount:</span><span>-₹${lastInvoice.discount}</span></div>` : ""}
            <div class="row"><span>Estimated GST:</span><span>₹${lastInvoice.tax}</span></div>
            <div class="row grand-total"><span>GRAND TOTAL:</span><span>₹${lastInvoice.grandTotal}</span></div>
          </div>
          <div class="center subtitle" style="margin-top: 16px;">
            Thank you for shopping with us!<br/>
            Exchange within 7 days with bill.
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  // Filter products by selected category
  const displayedCatalog = (results.length > 0 ? results : catalog).filter((item) => {
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "APPAREL") return item.category.toLowerCase().includes("ethnic") || item.category.toLowerCase().includes("wear");
    if (selectedCategory === "WESTERN") return item.category.toLowerCase().includes("western");
    if (selectedCategory === "DRESSES") return item.category.toLowerCase().includes("dress") || item.category.toLowerCase().includes("party");
    if (selectedCategory === "KIDS") return item.category.toLowerCase().includes("girl") || item.category.toLowerCase().includes("kid");
    if (selectedCategory === "ACCESSORIES") return item.category.toLowerCase().includes("access");
    return item.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const categoriesList = [
    { id: "ALL", label: "All" },
    { id: "APPAREL", label: "Indian Ethnic" },
    { id: "WESTERN", label: "Western" },
    { id: "DRESSES", label: "Dresses" },
    { id: "KIDS", label: "Kids" },
    { id: "ACCESSORIES", label: "Accessories" },
  ];

  return (
    <div
      style={{
        height: "100vh",
        maxHeight: "100vh",
        display: "flex",
        overflow: "hidden",
        background: "#faf7f2",
        color: "#261b18",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* 2. MAIN POS WORKSPACE */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* TOP BAR */}
        <TopBar
          showSearch
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Search by product name, SKU, barcode, color..."
          rightContent={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#7a6e69", fontWeight: 600 }}>
                Catalog: <b style={{ color: "#b06354" }}>{displayedCatalog.length} styles</b>
              </span>
              <button
                onClick={clearCart}
                style={{
                  padding: "7px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                  background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 10px rgba(176, 99, 84, 0.3)",
                }}
              >
                <span>⚡ New Bill</span>
              </button>
            </div>
          }
        />

        {/* WORKSPACE: PRODUCT CATALOG GRID (LEFT) + SHOPPING CART / CURRENT BILL (RIGHT) */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 390px",
            height: "calc(100vh - 56px)",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* LEFT: Category Pills + Apparel Cards Grid */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
              borderRight: "1px solid #ebdcd0",
              background: "#faf7f2",
            }}
          >
            {/* Category Filter Pills (Exact boutique style from screenshot) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                borderBottom: "1px solid #ebdcd0",
                overflowX: "auto",
                flexShrink: 0,
                background: "#fbf8f5",
              }}
            >
              {categoriesList.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 18,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      border: "none",
                      background: isActive ? "#b06354" : "#efe6dc",
                      color: isActive ? "#ffffff" : "#695952",
                      boxShadow: isActive ? "0 2px 8px rgba(176, 99, 84, 0.3)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* PRODUCT GRID - FULLY SCROLLABLE (UP & DOWN) */}
            <div
              id="pos-product-grid"
              style={{
                flex: 1,
                height: "100%",
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                scrollBehavior: "smooth",
                padding: "16px 18px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: 16,
                alignContent: "flex-start",
              }}
            >
              {displayedCatalog.map((p) => {
                const isLow = p.stock <= 5;
                const isMedium = p.stock > 5 && p.stock <= 15;

                return (
                  <div
                    key={p.id}
                    onClick={() => add(p)}
                    style={{
                      cursor: "pointer",
                      borderRadius: 12,
                      border: "1px solid #ebdcd0",
                      background: "#ffffff",
                      overflow: "hidden",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 2px 8px rgba(92, 57, 48, 0.05)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#b06354";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(176, 99, 84, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#ebdcd0";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(92, 57, 48, 0.05)";
                    }}
                  >
                    {/* Apparel Photo Banner */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 150,
                        background: "#f4eee6",
                        overflow: "hidden",
                      }}
                    >
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s ease",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 48,
                            opacity: 0.3,
                          }}
                        >
                          👗
                        </div>
                      )}

                      {/* Stock Badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 700,
                          background: isLow
                            ? "rgba(220, 38, 38, 0.9)"
                            : isMedium
                            ? "rgba(217, 119, 6, 0.9)"
                            : "rgba(22, 163, 74, 0.9)",
                          color: "#ffffff",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        }}
                      >
                        {p.stock} in stock
                      </div>

                      {/* Silhouette tag badge */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 8,
                          left: 8,
                          padding: "2px 7px",
                          borderRadius: 6,
                          fontSize: 9,
                          fontWeight: 700,
                          background: "rgba(255, 255, 255, 0.9)",
                          color: "#4a3c36",
                          border: "1px solid #ebdcd0",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.subCategory || p.category.split(" ")[0]}
                      </div>
                    </div>

                    {/* Product Name & Specs */}
                    <div
                      style={{
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#261a17",
                            lineHeight: 1.3,
                            margin: 0,
                            marginBottom: 4,
                          }}
                        >
                          {p.name}
                        </h4>

                        <div style={{ fontSize: 10, color: "#8a7b75", marginBottom: 8 }}>
                          SKU: <b>{p.sku}</b> • Size: {p.size} • {p.color}
                        </div>
                      </div>

                      {/* Price & Add Action */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 8,
                          borderTop: "1px solid #f1eae2",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#261a17" }}>
                            ₹{p.salePrice}
                          </div>
                          {p.mrp > Number(p.salePrice) && (
                            <div style={{ fontSize: 10, color: "#a59791", textDecoration: "line-through" }}>
                              MRP ₹{p.mrp}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            add(p);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 16,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            border: "none",
                            background: "#b06354",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            boxShadow: "0 2px 6px rgba(176, 99, 84, 0.3)",
                          }}
                        >
                          <span>+ Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {displayedCatalog.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "48px 20px",
                    color: "#8a7b75",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.5 }}>🔍</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#261a17" }}>No matching apparel found</p>
                  <p style={{ fontSize: 12 }}>Try typing another search term or select "All"</p>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: CURRENT BILL & ORDER SUMMARY PANEL */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
              background: "#ffffff",
              borderLeft: "1px solid #ebdcd0",
            }}
          >
            {/* Bill Header */}
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #f1eae2",
                flexShrink: 0,
                background: "#fdfaf7",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#261a17", margin: 0 }}>
                    Current Bill
                  </h3>
                  <div style={{ fontSize: 11, color: "#8a7b75", marginTop: 2 }}>
                    {cart.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0)} items in basket
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#b06354",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "#ffffff",
              }}
            >
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 12px", color: "#8a7b75" }}>
                  <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>🛍️</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#4a3c36", margin: 0 }}>
                    No items in current bill
                  </p>
                  <p style={{ fontSize: 11, marginTop: 4 }}>Tap any apparel card to add to bill</p>
                </div>
              ) : (
                cart.map((line, idx) => {
                  const lineTotal =
                    (Number(line.product.salePrice) || 0) *
                    (Number(line.quantity) || 0) *
                    (1 - (Number(line.discountPct) || 0) / 100);

                  return (
                    <div
                      key={idx}
                      style={{
                        background: "#faf6f1",
                        border: "1px solid #ede3d8",
                        borderRadius: 10,
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      {/* Mini Thumbnail */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: "#eee4d8",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {line.product.imageUrl ? (
                          <img
                            src={line.product.imageUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            👗
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#261a17",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {line.product.name}
                        </div>
                        <div style={{ fontSize: 10, color: "#8a7b75", marginTop: 1 }}>
                          Size: {line.product.size} | Color: {line.product.color}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#b06354", marginTop: 2 }}>
                          ₹{lineTotal.toFixed(0)}
                        </div>
                      </div>

                      {/* Qty Steppers */}
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <button
                          onClick={() => adjustQuantity(idx, -1)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            background: "#ede3d8",
                            border: "none",
                            color: "#4a3c36",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          −
                        </button>
                        <input
                          value={line.quantity}
                          onChange={(e) => updateQuantity(idx, e.target.value)}
                          style={{
                            width: 28,
                            padding: "2px",
                            textAlign: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 4,
                            background: "#ffffff",
                            border: "1px solid #ebdcd0",
                            color: "#261a17",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => adjustQuantity(idx, 1)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            background: "#ede3d8",
                            border: "none",
                            color: "#4a3c36",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Delete item */}
                      <button
                        onClick={() => removeLine(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#a55",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* BILL DISCOUNT TOOL */}
            <div
              style={{
                padding: "10px 14px",
                background: "#fbf6f0",
                borderTop: "1px solid #ebdcd0",
                borderBottom: "1px solid #ebdcd0",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#8a4f43" }}>
                  🏷️ Bill Discount
                </span>

                <div
                  style={{
                    display: "flex",
                    background: "#ede3d8",
                    borderRadius: 6,
                    padding: 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setBillDiscountType("PCT")}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      background: billDiscountType === "PCT" ? "#b06354" : "transparent",
                      color: billDiscountType === "PCT" ? "#ffffff" : "#6e5d57",
                    }}
                  >
                    % Percent
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillDiscountType("FLAT")}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      background: billDiscountType === "FLAT" ? "#b06354" : "transparent",
                      color: billDiscountType === "FLAT" ? "#ffffff" : "#6e5d57",
                    }}
                  >
                    ₹ Flat Off
                  </button>
                </div>
              </div>

              {/* Preset buttons */}
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                {billDiscountType === "PCT"
                  ? [
                      { label: "5%", val: "5" },
                      { label: "10%", val: "10" },
                      { label: "15%", val: "15" },
                      { label: "20%", val: "20" },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setBillDiscountValue(billDiscountValue === preset.val ? "" : preset.val)}
                        style={{
                          flex: 1,
                          padding: "3px 0",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                          border: billDiscountValue === preset.val ? "1px solid #b06354" : "1px solid #ebdcd0",
                          background: billDiscountValue === preset.val ? "#b06354" : "#ffffff",
                          color: billDiscountValue === preset.val ? "#ffffff" : "#695952",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))
                  : [
                      { label: "₹50", val: "50" },
                      { label: "₹100", val: "100" },
                      { label: "₹250", val: "250" },
                      { label: "₹500", val: "500" },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setBillDiscountValue(billDiscountValue === preset.val ? "" : preset.val)}
                        style={{
                          flex: 1,
                          padding: "3px 0",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                          border: billDiscountValue === preset.val ? "1px solid #b06354" : "1px solid #ebdcd0",
                          background: billDiscountValue === preset.val ? "#b06354" : "#ffffff",
                          color: billDiscountValue === preset.val ? "#ffffff" : "#695952",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
              </div>

              {/* Custom input */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  placeholder={billDiscountType === "PCT" ? "Custom % (e.g. 10)" : "Custom ₹ off (e.g. 150)"}
                  value={billDiscountValue}
                  onChange={(e) => setBillDiscountValue(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    background: "#ffffff",
                    border: "1px solid #ebdcd0",
                    borderRadius: 6,
                    color: "#261a17",
                    fontSize: 11,
                    outline: "none",
                  }}
                />
                {billDiscountValue && (
                  <button
                    type="button"
                    onClick={() => setBillDiscountValue("")}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "none",
                      background: "#fee2e2",
                      color: "#dc2626",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div
              style={{
                padding: "8px 14px",
                display: "flex",
                gap: 6,
                flexShrink: 0,
                background: "#faf6f1",
              }}
            >
              {(["UPI", "CASH", "CARD", "CREDIT"] as const).map((m) => {
                const labels: Record<string, string> = {
                  UPI: "📱 UPI / QR",
                  CASH: "💵 Cash",
                  CARD: "💳 Card",
                  CREDIT: "📑 Khata",
                };
                const isActive = method === m;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setMethod(m);
                      if (m === "UPI" && cart.length > 0) setShowUpiModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 2px",
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: isActive ? "1px solid #b06354" : "1px solid #ebdcd0",
                      background: isActive ? "#b06354" : "#ffffff",
                      color: isActive ? "#ffffff" : "#695952",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {labels[m]}
                  </button>
                );
              })}
            </div>

            {/* Bill Financial Summary */}
            <div
              style={{
                padding: "10px 14px",
                borderTop: "1px solid #ebdcd0",
                flexShrink: 0,
                background: "#fdfaf7",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7a6e69", marginBottom: 3 }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {totalDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#dc2626", marginBottom: 3, fontWeight: 700 }}>
                  <span>Discount</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7a6e69", marginBottom: 5 }}>
                <span>VAT / GST (5%)</span>
                <span>₹{estimatedTax.toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 6,
                  borderTop: "1px solid #e7d8cb",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: "#261a17" }}>Total</span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#261a17",
                  }}
                >
                  ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Customer Details & WhatsApp Auto-Send */}
            <div style={{ padding: "8px 14px", flexShrink: 0, background: "#ffffff" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    fontSize: 11,
                    background: "#faf6f1",
                    border: "1px solid #ebdcd0",
                    borderRadius: 6,
                    color: "#261a17",
                    outline: "none",
                  }}
                />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 WhatsApp"
                  style={{
                    flex: 1.2,
                    padding: "6px 8px",
                    fontSize: 11,
                    background: "#faf6f1",
                    border: "1px solid #ebdcd0",
                    borderRadius: 6,
                    color: "#261a17",
                    outline: "none",
                  }}
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  color: autoWhatsApp ? "#16a34a" : "#8a7b75",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={autoWhatsApp}
                  onChange={(e) => setAutoWhatsApp(e.target.checked)}
                  style={{ accentColor: "#b06354" }}
                />
                <span>📄 Send Formal PDF Receipt via WhatsApp on Checkout</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: "8px 14px 14px", display: "flex", gap: 8, flexShrink: 0, background: "#ffffff" }}>
              <button
                onClick={() => {
                  setCart([]);
                  setBillDiscountValue("");
                  searchInput.current?.focus();
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "1px solid #ebdcd0",
                  background: "#fbf6f0",
                  color: "#6e5d57",
                }}
              >
                Cancel
              </button>

              <button
                onClick={checkout}
                disabled={cart.length === 0 || isCheckingOut}
                style={{
                  flex: 2,
                  padding: "11px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: cart.length === 0 || isCheckingOut ? "not-allowed" : "pointer",
                  background: cart.length === 0 ? "#d5c8be" : "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                  color: "#ffffff",
                  boxShadow: cart.length > 0 ? "0 4px 14px rgba(176, 99, 84, 0.35)" : "none",
                }}
              >
                {isCheckingOut ? "Generating Bill..." : "Proceed to payment →"}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* MODAL 1: INSTANT DIGITAL TAX BILL */}
      {showBillModal && lastInvoice && (
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
              width: 500,
              maxWidth: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              background: "#ffffff",
              borderRadius: 20,
              border: "1px solid #ebdcd0",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 800,
                    background: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  ✓ BILL GENERATED &amp; PAID
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#261a17", marginTop: 6, margin: 0 }}>
                  {lastInvoice.number}
                </h2>
                <div style={{ fontSize: 11, color: "#7a6e69", marginTop: 2 }}>
                  {lastInvoice.date} • {lastInvoice.time} • Paid via {lastInvoice.method}
                </div>
              </div>

              <button
                onClick={() => setShowBillModal(false)}
                style={{ background: "transparent", border: "none", color: "#8a7b75", fontSize: 22, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* PDF Dispatch Confirmation Banner */}
            {(pdfNotice || receiptShareLink) && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: 8,
                  marginBottom: 14,
                  fontSize: 11.5,
                  color: "#065f46",
                  fontWeight: 600,
                  lineHeight: 1.45,
                }}
              >
                <div>📄 {pdfNotice || "1-click hosted formal PDF receipt link is ready to share."}</div>
                {receiptShareLink && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <a
                      href={receiptShareLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#047857",
                        background: "#ffffff",
                        border: "1px solid #a7f3d0",
                        padding: "4px 10px",
                        borderRadius: 6,
                        textDecoration: "none",
                      }}
                    >
                      👁️ Open Hosted Receipt Page ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(receiptShareLink);
                        setPdfNotice("Formal PDF receipt link copied to clipboard!");
                      }}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#261a17",
                        background: "#ffffff",
                        border: "1px solid #d1fae5",
                        padding: "4px 10px",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      📋 Copy Receipt Link
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Customer Box */}
            <div
              style={{
                padding: "10px 14px",
                background: "#faf6f1",
                border: "1px solid #ebdcd0",
                borderRadius: 8,
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "#8a7b75" }}>Customer:</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#261a17" }}>{lastInvoice.customerName}</div>
                <div style={{ fontSize: 11, color: "#695952" }}>{lastInvoice.customerPhone}</div>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {supportsNativeShare && (
                  <button
                    onClick={() => handleNativeSharePdf(lastInvoice)}
                    title="Attach & share PDF file directly via device share sheet"
                    style={{
                      padding: "7px 11px",
                      borderRadius: 6,
                      border: "1px solid #b06354",
                      background: "#ffffff",
                      color: "#b06354",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>↗ Share PDF</span>
                  </button>
                )}

                <button
                  onClick={() => handleSendPdfWhatsApp(lastInvoice)}
                  title="Download formal PDF receipt and open WhatsApp chat"
                  style={{
                    padding: "7px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "#25D366",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span>📄 Send PDF on WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 14 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ebdcd0", color: "#8a7b75", textAlign: "left" }}>
                    <th style={{ padding: "6px 0" }}>Item</th>
                    <th style={{ padding: "6px 0", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "6px 0", textAlign: "right" }}>Rate</th>
                    <th style={{ padding: "6px 0", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastInvoice.items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f4eee6" }}>
                      <td style={{ padding: "6px 0" }}>
                        <div style={{ color: "#261a17", fontWeight: 600 }}>{it.name}</div>
                        <div style={{ fontSize: 10, color: "#8a7b75" }}>{it.size} | {it.color}</div>
                      </td>
                      <td style={{ padding: "6px 0", textAlign: "center", color: "#555" }}>{it.qty}</td>
                      <td style={{ padding: "6px 0", textAlign: "right", color: "#555" }}>₹{it.rate}</td>
                      <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 700, color: "#261a17" }}>
                        ₹{it.total.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div
              style={{
                padding: "10px 14px",
                background: "#faf6f1",
                borderRadius: 8,
                fontSize: 12,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                <span>Subtotal</span>
                <span>₹{lastInvoice.subtotal}</span>
              </div>
              {Number(lastInvoice.discount) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#dc2626", fontWeight: 700 }}>
                  <span>Discount</span>
                  <span>-₹{lastInvoice.discount}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", color: "#7a6e69" }}>
                <span>GST (5%)</span>
                <span>₹{lastInvoice.tax}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#261a17",
                  paddingTop: 6,
                  borderTop: "1px solid #e7d8cb",
                }}
              >
                <span>Grand Total</span>
                <span>₹{lastInvoice.grandTotal}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleDownloadPdf(lastInvoice)}
                  style={{
                    flex: 1,
                    padding: "9px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1px solid #b06354",
                    background: "#ffffff",
                    color: "#b06354",
                  }}
                >
                  ⬇ Download PDF
                </button>

                <button
                  onClick={() => previewReceiptPdf(lastInvoice)}
                  style={{
                    flex: 1,
                    padding: "9px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1px solid #ebdcd0",
                    background: "#fbf6f0",
                    color: "#261a17",
                  }}
                >
                  👁️ View / Print PDF
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={printThermalSlip}
                  style={{
                    flex: 1,
                    padding: "9px 10px",
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1px solid #ebdcd0",
                    background: "#fbf6f0",
                    color: "#6e5d57",
                  }}
                >
                  🖨️ Thermal Slip
                </button>

                <button
                  onClick={() => setShowBillModal(false)}
                  style={{
                    flex: 1.5,
                    padding: "10px",
                    fontSize: 13,
                    fontWeight: 800,
                    border: "none",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #b06354 0%, #9e5345 100%)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Done / Next Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UPI QR CODE */}
      {showUpiModal && (
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
              width: 360,
              padding: 24,
              textAlign: "center",
              background: "#ffffff",
              borderRadius: 20,
              border: "1px solid #ebdcd0",
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#261a17", margin: 0 }}>
              Scan UPI QR to Pay
            </h3>
            <p style={{ fontSize: 11, color: "#7a6e69", marginTop: 4 }}>
              Supports PhonePe, Google Pay, Paytm, BHIM
            </p>

            <div
              style={{
                width: 190,
                height: 190,
                margin: "16px auto",
                padding: 10,
                background: "#faf6f1",
                borderRadius: 12,
                border: "1px solid #ebdcd0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=upi://pay?pa=aura.boutique@icici&pn=BillVortexBoutique&am=${grandTotal.toFixed(2)}&cu=INR`}
                alt="UPI QR"
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: "#261a17", marginBottom: 14 }}>
              ₹{grandTotal.toFixed(2)}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowUpiModal(false)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 6,
                  border: "1px solid #ebdcd0",
                  background: "#fbf6f0",
                  color: "#6e5d57",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowUpiModal(false);
                  checkout();
                }}
                style={{
                  flex: 1.5,
                  padding: "8px",
                  fontSize: 12,
                  fontWeight: 800,
                  border: "none",
                  borderRadius: 6,
                  background: "#b06354",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Payment Received
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
