import { describe, it, expect } from "vitest";
import { financialYear, formatInvoiceNumber } from "./index";

describe("invoice-core", () => {
  it("derives the Indian financial year", () => {
    expect(financialYear(new Date(2025, 3, 1))).toBe("2526"); // 1 Apr 2025
    expect(financialYear(new Date(2026, 2, 31))).toBe("2526"); // 31 Mar 2026
    expect(financialYear(new Date(2026, 3, 1))).toBe("2627");
  });
  it("formats numbers and enforces the 16 character limit", () => {
    expect(formatInvoiceNumber("INV", "2526", 1)).toBe("INV/2526/00001");
    expect(() => formatInvoiceNumber("LONGPREFIX", "2526", 1)).toThrow();
  });
});
