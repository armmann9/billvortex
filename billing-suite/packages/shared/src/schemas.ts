import { z } from "zod";

export const money = z.string().regex(/^\d+(\.\d{1,2})?$/, "Expected amount like 100 or 100.50");
export const qty = z.string().regex(/^\d+(\.\d{1,3})?$/, "Expected quantity like 2 or 2.5");
export const stateCode = z.string().regex(/^\d{2}$/, "2-digit GST state code");
export const gstin = z
  .string()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Invalid GSTIN format");

export const registerSchema = z.object({
  businessName: z.string().min(2),
  gstin: gstin.optional(),
  stateCode,
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  businessId: z.string().uuid().optional(),
});

export const productSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  brand: z.string().optional(),
  design: z.string().optional(),
  hsn: z.string().optional(),
  gstRate: z.string().default("0"),
  unit: z.enum(["PCS", "MTR", "YD", "CM", "KG", "ROLL", "BUNDLE"]).default("PCS"),
  isFabric: z.boolean().default(false),
  salePrice: money,
  wholesalePrice: money.optional(),
  costPrice: money.optional(),
  reorderLevel: qty.optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  gstin: gstin.optional(),
  stateCode: stateCode.optional(),
  address: z.string().optional(),
  creditLimit: money.optional(),
  paymentTermsDays: z.number().int().min(0).optional(),
});

export const stockReceiptSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: qty,
  reason: z.enum(["OPENING", "PURCHASE", "ADJUSTMENT"]).default("PURCHASE"),
  // For fabric: register a roll
  lot: z
    .object({
      lotCode: z.string().min(1),
      rollCode: z.string().min(1),
      shade: z.string().optional(),
      colour: z.string().optional(),
      width: money.optional(),
    })
    .optional(),
});

export const paymentSchema = z.object({
  method: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE", "GATEWAY"]),
  amount: money,
  reference: z.string().max(100).optional(),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid().optional(), // omit => walk-in
  customerPhone: z.string().min(8).optional(), // used for on-the-spot walk-in SMS delivery
  placeOfSupplyStateCode: stateCode.optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        lotId: z.string().uuid().optional(), // roll sale
        quantity: qty,
        discountPct: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/).optional(),
        unitPrice: money.optional(), // honoured only for OWNER
      }),
    )
    .min(1),
  payments: z.array(paymentSchema).default([]),
  // counter shortcut: settle the full server-calculated total with one method
  payFullWith: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE", "GATEWAY"]).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateInvoice = z.infer<typeof createInvoiceSchema>;
