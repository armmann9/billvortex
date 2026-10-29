/**
 * Deterministic GST calculation. Never delegate tax maths to an LLM.
 * All money uses Decimal (no binary floats). Rates/categories must come from
 * versioned, accountant-approved configuration - verify against current GST rules.
 */
import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

const r2 = (d: Decimal) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export type TaxCategory = "TAXABLE" | "EXEMPT" | "NIL_RATED";

export interface LineInput {
  quantity: string;
  unitPrice: string;
  discountPct?: string;
  discountAmount?: string;
  gstRate: string; // e.g. "5", "12", "18"
  cessRate?: string;
  taxCategory?: TaxCategory;
  taxInclusive?: boolean;
}

export interface ChargeInput {
  amount: string; // freight / packing etc.
  gstRate: string;
}

export interface InvoiceInput {
  sellerStateCode: string; // 2-digit GST state code
  placeOfSupplyStateCode: string;
  lines: LineInput[];
  charges?: ChargeInput[];
  roundToRupee?: boolean;
}

export interface LineResult {
  gross: string;
  discount: string;
  taxableValue: string;
  cgst: string;
  sgst: string;
  igst: string;
  cess: string;
  total: string;
}

export interface InvoiceResult {
  intraState: boolean;
  lines: LineResult[];
  charges: LineResult[];
  subtotal: string; // sum of gross
  discountTotal: string;
  taxableTotal: string;
  cgst: string;
  sgst: string;
  igst: string;
  cess: string;
  roundOff: string;
  grandTotal: string;
}

const STATE_RE = /^\d{2}$/;

function computeLine(l: LineInput, intra: boolean): LineResult {
  const qty = new Decimal(l.quantity);
  const price = new Decimal(l.unitPrice);
  if (qty.lte(0)) throw new Error("Quantity must be greater than zero");
  if (price.lt(0)) throw new Error("Unit price cannot be negative");
  if (l.discountPct && l.discountAmount) {
    throw new Error("Provide either discountPct or discountAmount, not both");
  }

  const gross = r2(qty.mul(price));
  let discount = new Decimal(l.discountAmount ?? 0);
  if (l.discountPct) {
    const pct = new Decimal(l.discountPct);
    if (pct.lt(0) || pct.gt(100)) throw new Error("discountPct must be 0-100");
    discount = gross.mul(pct).div(100);
  }
  discount = r2(discount);
  if (discount.lt(0) || discount.gt(gross)) throw new Error("Invalid discount");

  const net = gross.minus(discount);
  const taxable = (l.taxCategory ?? "TAXABLE") === "TAXABLE";
  const rate = taxable ? new Decimal(l.gstRate) : new Decimal(0);
  const cessRate = taxable ? new Decimal(l.cessRate ?? 0) : new Decimal(0);
  if (rate.lt(0) || cessRate.lt(0)) throw new Error("Tax rates cannot be negative");

  const taxableValue = r2(
    l.taxInclusive
      ? net.div(new Decimal(1).plus(rate.plus(cessRate).div(100)))
      : net,
  );

  let cgst = new Decimal(0);
  let sgst = new Decimal(0);
  let igst = new Decimal(0);
  if (intra) {
    const half = r2(taxableValue.mul(rate).div(200));
    cgst = half;
    sgst = half; // CGST always equals SGST/UTGST
  } else {
    igst = r2(taxableValue.mul(rate).div(100));
  }
  const cess = r2(taxableValue.mul(cessRate).div(100));
  const total = taxableValue.plus(cgst).plus(sgst).plus(igst).plus(cess);

  return {
    gross: gross.toFixed(2),
    discount: discount.toFixed(2),
    taxableValue: taxableValue.toFixed(2),
    cgst: cgst.toFixed(2),
    sgst: sgst.toFixed(2),
    igst: igst.toFixed(2),
    cess: cess.toFixed(2),
    total: total.toFixed(2),
  };
}

export function calculateInvoice(input: InvoiceInput): InvoiceResult {
  if (!STATE_RE.test(input.sellerStateCode) || !STATE_RE.test(input.placeOfSupplyStateCode)) {
    throw new Error("State codes must be 2 digits");
  }
  if (input.lines.length === 0) throw new Error("Invoice needs at least one line");

  const intra = input.sellerStateCode === input.placeOfSupplyStateCode;
  const lines = input.lines.map((l) => computeLine(l, intra));
  const charges = (input.charges ?? []).map((c) =>
    computeLine({ quantity: "1", unitPrice: c.amount, gstRate: c.gstRate }, intra),
  );

  const all = [...lines, ...charges];
  const sum = (k: keyof LineResult) =>
    all.reduce((a, x) => a.plus(x[k]), new Decimal(0));

  const total = sum("total");
  let grand = total;
  let roundOff = new Decimal(0);
  if (input.roundToRupee) {
    grand = total.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    roundOff = grand.minus(total);
  }

  return {
    intraState: intra,
    lines,
    charges,
    subtotal: sum("gross").toFixed(2),
    discountTotal: sum("discount").toFixed(2),
    taxableTotal: sum("taxableValue").toFixed(2),
    cgst: sum("cgst").toFixed(2),
    sgst: sum("sgst").toFixed(2),
    igst: sum("igst").toFixed(2),
    cess: sum("cess").toFixed(2),
    roundOff: roundOff.toFixed(2),
    grandTotal: grand.toFixed(2),
  };
}
