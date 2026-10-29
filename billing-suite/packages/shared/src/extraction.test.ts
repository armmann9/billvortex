import { describe, it, expect } from "vitest";
import { validateExtraction, type ExtractedInvoice } from "./extraction";

const good: ExtractedInvoice = {
  supplierName: "ABC Textiles",
  supplierGstin: "08ABCDE1234F1Z5",
  invoiceNumber: "T-101",
  invoiceDate: "2025-08-01",
  lines: [
    { description: "Cotton 40s", hsn: "5208", quantity: 100, unit: "MTR", rate: 100, discount: 0, taxableValue: 10000, gstRate: 5, taxAmount: 500, lineTotal: 10500 },
  ],
  subtotal: 10000,
  totalTax: 500,
  grandTotal: 10500,
  confidence: {},
  evidence: {},
};

describe("validateExtraction", () => {
  it("accepts a consistent invoice", () => {
    expect(validateExtraction(good, { today: new Date("2025-09-01") })).toEqual([]);
  });
  it("flags arithmetic mismatches as errors", () => {
    const bad = { ...good, grandTotal: 12000 };
    const issues = validateExtraction(bad, { today: new Date("2025-09-01") });
    expect(issues.some((i) => i.field === "grandTotal" && i.severity === "error")).toBe(true);
  });
  it("flags bad GSTIN and low confidence", () => {
    const issues = validateExtraction(
      { ...good, supplierGstin: "BADGSTIN", confidence: { invoiceNumber: 0.4 } },
      { today: new Date("2025-09-01") },
    );
    expect(issues.some((i) => i.field === "supplierGstin" && i.severity === "error")).toBe(true);
    expect(issues.some((i) => i.field === "invoiceNumber" && i.severity === "warning")).toBe(true);
  });
});
