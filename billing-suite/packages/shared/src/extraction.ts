import { z } from "zod";
import Decimal from "decimal.js";

/** Strict schema the LLM must return for a supplier bill. */
export const extractedLineSchema = z.object({
  description: z.string(),
  hsn: z.string().nullable().optional(),
  quantity: z.number(),
  unit: z.string().nullable().optional(),
  rate: z.number(),
  discount: z.number().default(0),
  taxableValue: z.number(),
  gstRate: z.number().default(0),
  taxAmount: z.number().default(0),
  lineTotal: z.number(),
});

export const extractedInvoiceSchema = z.object({
  supplierName: z.string(),
  supplierGstin: z.string().nullable().optional(),
  invoiceNumber: z.string(),
  invoiceDate: z.string(), // YYYY-MM-DD
  lines: z.array(extractedLineSchema),
  subtotal: z.number(), // sum of taxable values
  totalTax: z.number(),
  grandTotal: z.number(),
  // 0..1 confidence keyed by field name, e.g. "invoiceNumber", "lines.2.rate"
  confidence: z.record(z.number().min(0).max(1)).default({}),
  // Where on the page the value was read from (optional evidence)
  evidence: z
    .record(z.object({ page: z.number().optional(), text: z.string().optional() }))
    .default({}),
});

export type ExtractedInvoice = z.infer<typeof extractedInvoiceSchema>;

export interface ValidationIssue {
  field: string;
  severity: "error" | "warning";
  message: string;
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const near = (a: number, b: number, tol: number) =>
  new Decimal(a).minus(b).abs().lte(tol);

/** Deterministic checks. Errors block approval; warnings need a human to acknowledge. */
export function validateExtraction(
  inv: ExtractedInvoice,
  opts: { lowConfidence?: number; today?: Date } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const low = opts.lowConfidence ?? 0.8;
  const today = opts.today ?? new Date();

  if (inv.supplierGstin && !GSTIN_RE.test(inv.supplierGstin)) {
    issues.push({ field: "supplierGstin", severity: "error", message: "GSTIN format is invalid" });
  }
  if (!inv.supplierGstin) {
    issues.push({ field: "supplierGstin", severity: "warning", message: "Supplier GSTIN not found" });
  }
  if (!inv.invoiceNumber.trim()) {
    issues.push({ field: "invoiceNumber", severity: "error", message: "Invoice number missing" });
  }
  const d = new Date(inv.invoiceDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inv.invoiceDate) || Number.isNaN(d.getTime())) {
    issues.push({ field: "invoiceDate", severity: "error", message: "Invoice date is not a valid YYYY-MM-DD date" });
  } else if (d.getTime() > today.getTime() + 24 * 3600 * 1000) {
    issues.push({ field: "invoiceDate", severity: "warning", message: "Invoice date is in the future" });
  }
  if (inv.lines.length === 0) {
    issues.push({ field: "lines", severity: "error", message: "No line items extracted" });
  }

  let sumTaxable = new Decimal(0);
  let sumTax = new Decimal(0);
  inv.lines.forEach((l, i) => {
    const expected = new Decimal(l.quantity).mul(l.rate).minus(l.discount);
    if (!near(l.taxableValue, expected.toNumber(), 1)) {
      issues.push({
        field: `lines.${i}.taxableValue`,
        severity: "error",
        message: `Taxable value ${l.taxableValue} does not match qty x rate - discount (${expected.toFixed(2)})`,
      });
    }
    if (!near(l.lineTotal, new Decimal(l.taxableValue).plus(l.taxAmount).toNumber(), 1)) {
      issues.push({
        field: `lines.${i}.lineTotal`,
        severity: "error",
        message: "Line total does not equal taxable value + tax",
      });
    }
    sumTaxable = sumTaxable.plus(l.taxableValue);
    sumTax = sumTax.plus(l.taxAmount);
  });

  if (!near(inv.subtotal, sumTaxable.toNumber(), 1)) {
    issues.push({ field: "subtotal", severity: "error", message: `Subtotal differs from sum of lines (${sumTaxable.toFixed(2)})` });
  }
  if (!near(inv.totalTax, sumTax.toNumber(), 1)) {
    issues.push({ field: "totalTax", severity: "error", message: `Total tax differs from sum of line tax (${sumTax.toFixed(2)})` });
  }
  // allow up to Rs 1 round-off between subtotal+tax and grand total
  if (!near(inv.grandTotal, new Decimal(inv.subtotal).plus(inv.totalTax).toNumber(), 1)) {
    issues.push({ field: "grandTotal", severity: "error", message: "Grand total does not equal subtotal + tax (allowing Rs 1 round-off)" });
  }

  for (const [field, c] of Object.entries(inv.confidence)) {
    if (c < low) {
      issues.push({ field, severity: "warning", message: `Low confidence (${Math.round(c * 100)}%) - verify against the source` });
    }
  }
  return issues;
}
