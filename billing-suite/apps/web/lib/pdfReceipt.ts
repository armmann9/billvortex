import { jsPDF } from "jspdf";

export type ReceiptLineItem = {
  name: string;
  sku: string;
  size: string;
  color: string;
  fabric: string;
  qty: string;
  rate: string;
  total: number;
};

export type InvoiceReceiptData = {
  number: string;
  grandTotal: string;
  subtotal: string;
  tax: string;
  discount: string;
  method: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  items: ReceiptLineItem[];
};

export const STORE_INFO = {
  name: "BILLVORTEX BOUTIQUE",
  tagline: "Designer Apparel & Luxury Textile Retail",
  address: "Linking Road, Bandra West, Mumbai, Maharashtra - 400050",
  gstin: "27AABCA1234F1Z5",
  phone: "+91 98200 12345",
  email: "billing@billvortex.com",
  state: "Maharashtra (27)",
};

export function formatINR(value: number | string): string {
  const num = Number(value) || 0;
  return `Rs. ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function numberToIndianWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const twoDigits = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`;
  };

  const threeDigits = (n: number): string => {
    if (n === 0) return "";
    const h = Math.floor(n / 100);
    const rem = n % 100;
    return `${h ? ones[h] + " Hundred" : ""}${h && rem ? " " : ""}${twoDigits(rem)}`;
  };

  const rounded = Math.round(Math.max(0, num) * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Rupees Zero Only";

  const parts: string[] = [];
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));

  let result = rupees > 0 ? `Rupees ${parts.join(" ")}` : "";
  if (paise > 0) {
    result += `${result ? " and " : ""}${twoDigits(paise)} Paise`;
  }
  return `${result} Only`;
}

export function getReceiptFileName(invoiceNumber: string): string {
  const safe = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `BillVortex_Receipt_${safe}.pdf`;
}

export function buildReceiptPdf(invoice: InvoiceReceiptData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Color palette matching BillVortex luxury boutique branding
  const C_ESPRESSO: [number, number, number] = [38, 26, 23];
  const C_TERRACOTTA: [number, number, number] = [176, 99, 84];
  const C_MUTED: [number, number, number] = [112, 98, 92];
  const C_BORDER: [number, number, number] = [230, 216, 204];
  const C_CREAM: [number, number, number] = [250, 246, 241];
  const C_CREAM_ALT: [number, number, number] = [253, 250, 247];
  const C_GREEN_BG: [number, number, number] = [236, 253, 245];
  const C_GREEN_TXT: [number, number, number] = [5, 150, 105];
  const C_RED: [number, number, number] = [185, 28, 28];

  const drawPageFrame = () => {
    // Top terracotta accent bar
    doc.setFillColor(...C_TERRACOTTA);
    doc.rect(0, 0, pageWidth, 4.5, "F");

    // Subtle outer border
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.35);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  };

  drawPageFrame();

  // ---- HEADER ----
  let y = 18;

  // Left: Store identity
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...C_ESPRESSO);
  doc.text(STORE_INFO.name, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C_TERRACOTTA);
  doc.text(STORE_INFO.tagline.toUpperCase(), margin, y + 5.2);

  doc.setFontSize(8.5);
  doc.setTextColor(...C_MUTED);
  doc.text(STORE_INFO.address, margin, y + 10.5);
  doc.text(
    `GSTIN: ${STORE_INFO.gstin}   |   Ph: ${STORE_INFO.phone}   |   ${STORE_INFO.email}`,
    margin,
    y + 15
  );

  // Right: Document title & paid badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...C_TERRACOTTA);
  doc.text("TAX INVOICE", pageWidth - margin, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_MUTED);
  doc.text("ORIGINAL FOR RECIPIENT", pageWidth - margin, y + 4.8, { align: "right" });

  // Paid status pill
  const statusLabel = invoice.method === "CREDIT" ? "KHATA / CREDIT" : "PAID IN FULL";
  const pillW = invoice.method === "CREDIT" ? 31 : 26;
  const pillX = pageWidth - margin - pillW;
  const pillY = y + 8;
  doc.setFillColor(...C_GREEN_BG);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.3);
  doc.roundedRect(pillX, pillY, pillW, 6.2, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_GREEN_TXT);
  doc.text(statusLabel, pillX + pillW / 2, pillY + 4.2, { align: "center" });

  y += 20;

  // Divider
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.45);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ---- BILLING & INVOICE METADATA CARD ----
  const metaBoxH = 26;
  doc.setFillColor(...C_CREAM);
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, metaBoxH, 2, 2, "FD");

  // Vertical divider inside card
  const midX = margin + contentWidth * 0.54;
  doc.setDrawColor(...C_BORDER);
  doc.line(midX, y + 3, midX, y + metaBoxH - 3);

  // Left: Customer details
  const leftX = margin + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_TERRACOTTA);
  doc.text("BILLED TO", leftX, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C_ESPRESSO);
  doc.text(invoice.customerName || "Walk-in Customer", leftX, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C_MUTED);
  doc.text(`Phone: ${invoice.customerPhone || "N/A"}`, leftX, y + 17.2);
  doc.text(`Place of Supply: ${STORE_INFO.state}`, leftX, y + 22);

  // Right: Invoice metadata
  const rightLabelX = midX + 5;
  const rightValX = pageWidth - margin - 5;
  const metaRows: Array<[string, string, boolean?]> = [
    ["Invoice No.:", invoice.number, true],
    ["Invoice Date:", invoice.date],
    ["Time:", invoice.time],
    ["Payment Mode:", invoice.method, true],
  ];

  metaRows.forEach(([label, val, boldVal], idx) => {
    const rowY = y + 6.5 + idx * 5.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C_MUTED);
    doc.text(label, rightLabelX, rowY);

    doc.setFont("helvetica", boldVal ? "bold" : "normal");
    doc.setTextColor(...C_ESPRESSO);
    doc.text(String(val), rightValX, rowY, { align: "right" });
  });

  y += metaBoxH + 8;

  // ---- ITEMIZED TABLE ----
  const col = {
    idx: margin + 3,
    item: margin + 12,
    sku: margin + 92,
    qty: margin + 122,
    rate: margin + 150,
    amount: pageWidth - margin - 3,
  };

  const drawTableHeader = (topY: number) => {
    doc.setFillColor(...C_ESPRESSO);
    doc.rect(margin, topY, contentWidth, 8.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("#", col.idx, topY + 5.6);
    doc.text("ITEM DESCRIPTION", col.item, topY + 5.6);
    doc.text("SKU", col.sku, topY + 5.6);
    doc.text("QTY", col.qty, topY + 5.6, { align: "center" });
    doc.text("RATE", col.rate, topY + 5.6, { align: "right" });
    doc.text("AMOUNT", col.amount, topY + 5.6, { align: "right" });
    return topY + 8.5;
  };

  y = drawTableHeader(y);

  const items = invoice.items || [];
  items.forEach((it, index) => {
    const nameLines = doc.splitTextToSize(it.name || "Apparel Item", 74);
    const metaText = [
      it.size ? `Size: ${it.size}` : "",
      it.color ? `Color: ${it.color}` : "",
      it.fabric ? `Fabric: ${it.fabric}` : "",
    ]
      .filter(Boolean)
      .join("  |  ");

    const rowHeight = Math.max(12, nameLines.length * 4.5 + (metaText ? 5.5 : 3));

    // Page break if needed
    if (y + rowHeight > pageHeight - 62) {
      doc.addPage();
      drawPageFrame();
      y = 18;
      y = drawTableHeader(y);
    }

    // Zebra background
    if (index % 2 === 1) {
      doc.setFillColor(...C_CREAM_ALT);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
    }

    // Row bottom hairline
    doc.setDrawColor(239, 230, 220);
    doc.setLineWidth(0.25);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    const textY = y + 5.2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C_MUTED);
    doc.text(String(index + 1), col.idx, textY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C_ESPRESSO);
    doc.text(nameLines, col.item, textY);

    if (metaText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...C_MUTED);
      doc.text(metaText, col.item, textY + nameLines.length * 4.2);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C_MUTED);
    doc.text(it.sku || "-", col.sku, textY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C_ESPRESSO);
    doc.text(String(it.qty || "1"), col.qty, textY, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text(formatINR(it.rate), col.rate, textY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text(formatINR(it.total), col.amount, textY, { align: "right" });

    y += rowHeight;
  });

  // Table outer border around rows
  y += 6;

  // Check space for totals & footer
  if (y > pageHeight - 82) {
    doc.addPage();
    drawPageFrame();
    y = 20;
  }

  // ---- TOTALS & AMOUNT IN WORDS ----
  const subtotalNum = Number(invoice.subtotal) || 0;
  const discountNum = Number(invoice.discount) || 0;
  const taxNum = Number(invoice.tax) || 0;
  const grandTotalNum = Number(invoice.grandTotal) || 0;
  const halfTax = taxNum / 2;

  const summaryBoxW = 76;
  const summaryX = pageWidth - margin - summaryBoxW;
  const wordsBoxW = contentWidth - summaryBoxW - 8;

  // Left: Amount in words + payment note
  doc.setFillColor(...C_CREAM);
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, wordsBoxW, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_TERRACOTTA);
  doc.text("AMOUNT IN WORDS", margin + 4, y + 6);

  doc.setFont("times", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(...C_ESPRESSO);
  const wordsLines = doc.splitTextToSize(numberToIndianWords(grandTotalNum), wordsBoxW - 8);
  doc.text(wordsLines, margin + 4, y + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(...C_MUTED);
  doc.text(
    `Payment Mode: ${invoice.method}  |  Status: ${invoice.method === "CREDIT" ? "Posted to Khata" : "Received & Verified"}`,
    margin + 4,
    y + 24
  );

  // Right: Tax & Grand Total Summary
  let sy = y + 4;
  const sumLabelX = summaryX + 3;
  const sumValX = pageWidth - margin - 3;

  const drawSummaryRow = (
    label: string,
    val: string,
    color: [number, number, number] = C_MUTED,
    bold = false
  ) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(...color);
    doc.text(label, sumLabelX, sy);
    doc.text(val, sumValX, sy, { align: "right" });
    sy += 5.6;
  };

  drawSummaryRow("Subtotal", formatINR(subtotalNum), C_ESPRESSO);
  if (discountNum > 0) {
    drawSummaryRow("Discount Applied", `- ${formatINR(discountNum)}`, C_RED, true);
  }
  drawSummaryRow("CGST (Central Tax)", formatINR(halfTax), C_MUTED);
  drawSummaryRow("SGST (State Tax)", formatINR(halfTax), C_MUTED);

  sy += 1.5;
  doc.setFillColor(...C_ESPRESSO);
  doc.roundedRect(summaryX, sy - 4.5, summaryBoxW, 10.5, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL", sumLabelX, sy + 2.2);
  doc.text(formatINR(grandTotalNum), sumValX, sy + 2.2, { align: "right" });

  // ---- FOOTER: TERMS & AUTHORISED SIGNATORY ----
  const footerTop = Math.max(sy + 18, pageHeight - 48);
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.35);
  doc.line(margin, footerTop, pageWidth - margin, footerTop);

  // Terms on left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C_ESPRESSO);
  doc.text("TERMS & CONDITIONS", margin, footerTop + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_MUTED);
  const terms = [
    "1. Exchange is available within 7 days of purchase with original tag & this invoice.",
    "2. Customised, altered, or discounted merchandise is not eligible for refund.",
    "3. All disputes are subject to Mumbai jurisdiction. E. & O.E.",
  ];
  terms.forEach((line, i) => {
    doc.text(line, margin, footerTop + 11 + i * 4.2);
  });

  // Signatory block on right
  const sigX = pageWidth - margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C_ESPRESSO);
  doc.text(`For ${STORE_INFO.name}`, sigX, footerTop + 6, { align: "right" });

  doc.setDrawColor(...C_MUTED);
  doc.setLineWidth(0.25);
  doc.line(sigX - 46, footerTop + 21, sigX, footerTop + 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_MUTED);
  doc.text("Authorised Signatory", sigX, footerTop + 25.5, { align: "right" });

  // Bottom fine print
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(145, 132, 126);
  doc.text(
    "This is a computer-generated formal tax invoice and does not require a physical signature. Thank you for shopping with us.",
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );

  return doc;
}

export function generateReceiptPdfBlob(invoice: InvoiceReceiptData): { blob: Blob; fileName: string } {
  const doc = buildReceiptPdf(invoice);
  const fileName = getReceiptFileName(invoice.number);
  const blob = doc.output("blob");
  return { blob, fileName };
}

export function downloadReceiptPdf(invoice: InvoiceReceiptData): string {
  const doc = buildReceiptPdf(invoice);
  const fileName = getReceiptFileName(invoice.number);
  doc.save(fileName);
  return fileName;
}

export function previewReceiptPdf(invoice: InvoiceReceiptData): void {
  const { blob } = generateReceiptPdfBlob(invoice);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((encoded.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeReceiptPayload(invoice: InvoiceReceiptData): string {
  const compact = {
    n: invoice.number,
    g: invoice.grandTotal,
    s: invoice.subtotal,
    t: invoice.tax,
    dc: invoice.discount,
    m: invoice.method,
    dt: invoice.date,
    tm: invoice.time,
    cn: invoice.customerName,
    cp: invoice.customerPhone,
    it: invoice.items.map((x) => [x.name, x.sku, x.size, x.color, x.fabric, x.qty, x.rate, Number(x.total.toFixed(2))]),
  };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeReceiptPayload(encoded: string): InvoiceReceiptData | null {
  try {
    const raw = JSON.parse(fromBase64Url(encoded));
    if (!raw || !raw.n) return null;
    return {
      number: String(raw.n),
      grandTotal: String(raw.g ?? "0.00"),
      subtotal: String(raw.s ?? "0.00"),
      tax: String(raw.t ?? "0.00"),
      discount: String(raw.dc ?? "0.00"),
      method: String(raw.m ?? "UPI"),
      date: String(raw.dt ?? ""),
      time: String(raw.tm ?? ""),
      customerName: String(raw.cn ?? "Valued Customer"),
      customerPhone: String(raw.cp ?? ""),
      items: Array.isArray(raw.it)
        ? raw.it.map((row: any[]) => ({
            name: String(row[0] ?? "Item"),
            sku: String(row[1] ?? "-"),
            size: String(row[2] ?? "-"),
            color: String(row[3] ?? "-"),
            fabric: String(row[4] ?? "-"),
            qty: String(row[5] ?? "1"),
            rate: String(row[6] ?? "0"),
            total: Number(row[7] ?? 0),
          }))
        : [],
    };
  } catch {
    return null;
  }
}

export function buildReceiptShareUrl(invoice: InvoiceReceiptData): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const payload = encodeReceiptPayload(invoice);
  return `${baseUrl}/receipt/${encodeURIComponent(invoice.number)}?d=${payload}`;
}

export function buildFormalWhatsAppCaption(invoice: InvoiceReceiptData, receiptUrl?: string): string {
  const name = invoice.customerName || "Valued Customer";
  const linkLine = receiptUrl
    ? `\nView & Download Formal PDF Receipt:\n${receiptUrl}\n`
    : "";
  return (
    `Dear ${name},\n\n` +
    `Thank you for shopping at ${STORE_INFO.name}.\n` +
    `Your formal GST Tax Invoice is ready.\n\n` +
    `Invoice No: ${invoice.number}\n` +
    `Date: ${invoice.date} at ${invoice.time}\n` +
    `Payment Mode: ${invoice.method} (${invoice.method === "CREDIT" ? "Khata" : "Paid"})\n` +
    `Total Amount: ${formatINR(invoice.grandTotal)}\n` +
    `${linkLine}\n` +
    `Exchange is available within 7 days with original tags and this invoice.\n\n` +
    `Warm regards,\n` +
    `${STORE_INFO.name}\n` +
    `GSTIN: ${STORE_INFO.gstin}`
  );
}

export function canNativeSharePdf(): boolean {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) return false;
  try {
    const testFile = new File(["pdf"], "test.pdf", { type: "application/pdf" });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

export async function shareReceiptPdfNative(invoice: InvoiceReceiptData): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) return false;
  const { blob, fileName } = generateReceiptPdfBlob(invoice);
  const file = new File([blob], fileName, { type: "application/pdf" });
  if (!navigator.canShare({ files: [file] })) return false;

  await navigator.share({
    title: `Tax Invoice ${invoice.number} - ${STORE_INFO.name}`,
    text: buildFormalWhatsAppCaption(invoice),
    files: [file],
  });
  return true;
}

export function sendPdfReceiptViaWhatsApp(invoice: InvoiceReceiptData): {
  fileName: string;
  receiptUrl: string;
  whatsappUrl: string;
} {
  // Generate hosted 1-click formal PDF receipt link (no unwanted file download to Desktop)
  const fileName = getReceiptFileName(invoice.number);
  const receiptUrl = buildReceiptShareUrl(invoice);

  const cleanPhone = (invoice.customerPhone || "").replace(/\D/g, "");
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const caption = buildFormalWhatsAppCaption(invoice, receiptUrl);
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(caption)}`;
  window.open(whatsappUrl, "_blank");

  return { fileName, receiptUrl, whatsappUrl };
}

export type ZReportSummaryInput = {
  periodLabel: string;
  invoiceCount: number;
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  grandTotal: number;
  paymentSplit: Array<{ name: string; amount: number; txns: number; pct: number }>;
  gstSlabs: Array<{ rate: string; desc: string; taxable: number; cgst: number; sgst: number; total: number }>;
};

export function downloadZReportPdf(data: ZReportSummaryInput): string {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Header accent
  doc.setFillColor(176, 99, 84);
  doc.rect(0, 0, pageWidth, 4.5, "F");

  let y = 18;
  doc.setFont("times", "bold");
  doc.setFontSize(19);
  doc.setTextColor(38, 26, 23);
  doc.text(STORE_INFO.name, margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(176, 99, 84);
  doc.text("REGISTER Z-REPORT & TAX AUDIT", pageWidth - margin, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(112, 98, 92);
  doc.text(`GSTIN: ${STORE_INFO.gstin}  |  ${STORE_INFO.address}`, margin, y + 6);
  doc.text(
    `Period: ${data.periodLabel}  |  Generated: ${new Date().toLocaleString("en-IN")}`,
    pageWidth - margin,
    y + 6,
    { align: "right" }
  );

  y += 12;
  doc.setDrawColor(230, 216, 204);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Section 1: Financial Reconciliation
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(176, 99, 84);
  doc.text("1. SALES & TAX RECONCILIATION", margin, y);
  y += 5;

  const summaryRows: Array<[string, string, boolean?]> = [
    ["Total Invoices Issued", `${data.invoiceCount} Bills`],
    ["Gross Merchandise Sales", formatINR(data.subtotal)],
    ["Total Store Discounts", `- ${formatINR(data.discountTotal)}`],
    ["Net Taxable Turnover", formatINR(data.taxableTotal)],
    ["CGST Collected (Output)", formatINR(data.cgst)],
    ["SGST Collected (Output)", formatINR(data.sgst)],
    ["Total Output GST", formatINR(data.totalTax)],
    ["NET REGISTER GRAND TOTAL", formatINR(data.grandTotal), true],
  ];

  summaryRows.forEach(([label, val, bold]) => {
    if (bold) {
      doc.setFillColor(38, 26, 23);
      doc.rect(margin, y - 3.8, contentWidth, 8.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
    } else {
      doc.setTextColor(38, 26, 23);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    doc.text(label, margin + 3, y + 1.5);
    doc.text(val, pageWidth - margin - 3, y + 1.5, { align: "right" });
    y += bold ? 11 : 6.5;
  });

  // Section 2: Tender / Payment Split
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(176, 99, 84);
  doc.text("2. PAYMENT MODE TENDER BREAKDOWN", margin, y);
  y += 6;

  doc.setFillColor(250, 246, 241);
  doc.rect(margin, y - 4, contentWidth, 7, "F");
  doc.setFontSize(8);
  doc.setTextColor(112, 98, 92);
  doc.text("PAYMENT MODE", margin + 3, y + 0.5);
  doc.text("TXNS", margin + 95, y + 0.5, { align: "center" });
  doc.text("SHARE", margin + 125, y + 0.5, { align: "center" });
  doc.text("AMOUNT", pageWidth - margin - 3, y + 0.5, { align: "right" });
  y += 7;

  data.paymentSplit.forEach((p) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(38, 26, 23);
    doc.text(p.name, margin + 3, y);
    doc.text(String(p.txns), margin + 95, y, { align: "center" });
    doc.text(`${p.pct}%`, margin + 125, y, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(formatINR(p.amount), pageWidth - margin - 3, y, { align: "right" });
    y += 6.2;
  });

  // Section 3: GST Slab Breakdown
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(176, 99, 84);
  doc.text("3. GST SLAB SUMMARY (GSTR-1 READY)", margin, y);
  y += 6;

  doc.setFillColor(250, 246, 241);
  doc.rect(margin, y - 4, contentWidth, 7, "F");
  doc.setFontSize(8);
  doc.setTextColor(112, 98, 92);
  doc.text("SLAB", margin + 3, y + 0.5);
  doc.text("TAXABLE", margin + 62, y + 0.5, { align: "right" });
  doc.text("CGST", margin + 98, y + 0.5, { align: "right" });
  doc.text("SGST", margin + 132, y + 0.5, { align: "right" });
  doc.text("GROSS TOTAL", pageWidth - margin - 3, y + 0.5, { align: "right" });
  y += 7;

  data.gstSlabs.forEach((s) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(38, 26, 23);
    doc.text(s.rate, margin + 3, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatINR(s.taxable), margin + 62, y, { align: "right" });
    doc.text(formatINR(s.cgst), margin + 98, y, { align: "right" });
    doc.text(formatINR(s.sgst), margin + 132, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(formatINR(s.total), pageWidth - margin - 3, y, { align: "right" });
    y += 6.5;
  });

  const fileName = `BillVortex_ZReport_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}
