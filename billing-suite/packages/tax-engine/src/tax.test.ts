import { describe, it, expect } from "vitest";
import { calculateInvoice } from "./index";

describe("calculateInvoice", () => {
  it("splits intra-state GST into equal CGST and SGST", () => {
    const r = calculateInvoice({
      sellerStateCode: "08",
      placeOfSupplyStateCode: "08",
      lines: [{ quantity: "1", unitPrice: "1000", gstRate: "5" }],
    });
    expect(r.cgst).toBe("25.00");
    expect(r.sgst).toBe("25.00");
    expect(r.igst).toBe("0.00");
    expect(r.grandTotal).toBe("1050.00");
  });

  it("uses IGST for inter-state supply", () => {
    const r = calculateInvoice({
      sellerStateCode: "08",
      placeOfSupplyStateCode: "27",
      lines: [{ quantity: "2", unitPrice: "500", gstRate: "12" }],
    });
    expect(r.igst).toBe("120.00");
    expect(r.cgst).toBe("0.00");
    expect(r.grandTotal).toBe("1120.00");
  });

  it("applies percentage discount before tax and sells fabric by fractional metres", () => {
    const r = calculateInvoice({
      sellerStateCode: "08",
      placeOfSupplyStateCode: "08",
      lines: [{ quantity: "2.5", unitPrice: "200", discountPct: "10", gstRate: "5" }],
    });
    expect(r.subtotal).toBe("500.00");
    expect(r.discountTotal).toBe("50.00");
    expect(r.taxableTotal).toBe("450.00");
    expect(r.grandTotal).toBe("472.50");
  });

  it("backs tax out of tax-inclusive prices", () => {
    const r = calculateInvoice({
      sellerStateCode: "08",
      placeOfSupplyStateCode: "08",
      lines: [{ quantity: "1", unitPrice: "1050", gstRate: "5", taxInclusive: true }],
    });
    expect(r.taxableTotal).toBe("1000.00");
    expect(r.grandTotal).toBe("1050.00");
  });

  it("charges no tax on exempt and nil-rated lines", () => {
    const r = calculateInvoice({
      sellerStateCode: "08",
      placeOfSupplyStateCode: "08",
      lines: [{ quantity: "1", unitPrice: "300", gstRate: "18", taxCategory: "EXEMPT" }],
    });
    expect(r.grandTotal).toBe("300.00");
  });

  it("includes taxed freight charges and rounds to the nearest rupee", () => {
    const r = calculateInvoice({
      sellerStateCode: "08",
      placeOfSupplyStateCode: "08",
      lines: [{ quantity: "1", unitPrice: "99.99", gstRate: "5" }],
      charges: [{ amount: "50", gstRate: "18" }],
      roundToRupee: true,
    });
    expect(r.grandTotal).toBe("164.00");
    expect(r.roundOff).toBe("0.01");
  });

  it("rejects bad input", () => {
    const base = { sellerStateCode: "08", placeOfSupplyStateCode: "08" };
    expect(() => calculateInvoice({ ...base, lines: [] })).toThrow();
    expect(() =>
      calculateInvoice({ ...base, lines: [{ quantity: "0", unitPrice: "1", gstRate: "5" }] }),
    ).toThrow();
    expect(() =>
      calculateInvoice({
        ...base,
        lines: [{ quantity: "1", unitPrice: "10", discountAmount: "20", gstRate: "5" }],
      }),
    ).toThrow();
    expect(() =>
      calculateInvoice({ sellerStateCode: "8", placeOfSupplyStateCode: "08", lines: [{ quantity: "1", unitPrice: "1", gstRate: "5" }] }),
    ).toThrow();
  });
});
