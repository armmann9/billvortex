import { Router } from "express";
import crypto from "node:crypto";
import Decimal from "decimal.js";
import { Prisma, prisma } from "@app/database";
import { createInvoiceSchema, paymentSchema } from "@app/shared";
import { calculateInvoice } from "@app/tax-engine";
import { financialYear, formatInvoiceNumber } from "@app/invoice-core";
import { audit, requireRole } from "../auth";
import { HttpError } from "../errors";
import { sendInvoiceSms } from "../notifications";

const r = Router();
const wrap = (fn: (req: any, res: any) => Promise<unknown>) => (req: any, res: any, next: any) =>
  fn(req, res).catch(next);

/**
 * Issue an invoice. Everything happens in ONE transaction:
 * idempotency check -> server-side pricing/tax -> stock check + ledger write
 * -> roll deduction -> sequential numbering -> payments -> audit.
 */
r.post("/", requireRole("OWNER", "CASHIER"), wrap(async (req, res) => {
  const key = req.header("Idempotency-Key");
  if (!key) throw new HttpError(400, "Idempotency-Key header is required");
  const body = createInvoiceSchema.parse(req.body);
  const payloadHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
  const { businessId, userId, role } = req.auth;
  let customerPhone: string | null = null;
  let invoiceNumberForSms: string | null = null;
  let invoiceTotalForSms: string | null = null;

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const existing = await tx.idempotencyKey.findUnique({ where: { businessId_key: { businessId, key } } });
      if (existing) {
        if (existing.payloadHash !== payloadHash) throw new HttpError(422, "Idempotency-Key reused with a different payload");
        return tx.invoice.findUniqueOrThrow({ where: { id: existing.resourceId }, include: { items: true, payments: true } });
      }

      const business = await tx.business.findUniqueOrThrow({ where: { id: businessId } });
      const settings = business.settings as { invoicePrefix?: string; maxCashierDiscountPct?: number; roundToRupee?: boolean };
      const gstRegistered = !!business.gstin;
      const customer = body.customerId
        ? await tx.customer.findFirst({ where: { id: body.customerId, businessId } })
        : null;
      if (body.customerId && !customer) throw new HttpError(404, "Customer not found");
      customerPhone = customer?.phone ?? body.customerPhone ?? null;
      const placeOfSupply = body.placeOfSupplyStateCode ?? customer?.stateCode ?? business.stateCode;
      const location = await tx.stockLocation.findFirstOrThrow({ where: { businessId, isDefault: true } });

      // ---- build priced lines from SERVER data (clients cannot set prices unless OWNER) ----
      const maxDisc = settings.maxCashierDiscountPct ?? 5;
      const priced = [];
      for (const l of body.lines) {
        const product = await tx.product.findFirst({ where: { id: l.productId, businessId, active: true } });
        if (!product) throw new HttpError(404, `Product ${l.productId} not found`);
        const variant = l.variantId
          ? await tx.productVariant.findFirst({ where: { id: l.variantId, productId: product.id, businessId } })
          : null;
        if (l.variantId && !variant) throw new HttpError(404, "Variant not found");
        if (l.discountPct && role !== "OWNER" && Number(l.discountPct) > maxDisc) {
          throw new HttpError(403, `Discount above ${maxDisc}% needs owner approval`);
        }
        const unitPrice =
          role === "OWNER" && l.unitPrice ? l.unitPrice : (variant?.salePrice ?? product.salePrice).toString();
        priced.push({ l, product, variant, unitPrice });
      }

      const calc = calculateInvoice({
        sellerStateCode: business.stateCode,
        placeOfSupplyStateCode: placeOfSupply,
        roundToRupee: settings.roundToRupee ?? true,
        lines: priced.map(({ l, product, unitPrice }) => ({
          quantity: l.quantity,
          unitPrice,
          discountPct: l.discountPct,
          // unregistered businesses issue a bill of supply: no tax charged
          gstRate: gstRegistered ? product.gstRate.toString() : "0",
          taxCategory: gstRegistered ? (product.taxCategory as "TAXABLE" | "EXEMPT" | "NIL_RATED") : "EXEMPT",
        })),
      });

      // ---- stock: serialise per product, refuse to go negative ----
      for (const { l, product } of priced) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${businessId + ":" + product.id}))`;
        const bal = await tx.stockMovement.aggregate({
          where: { businessId, productId: product.id },
          _sum: { delta: true },
        });
        const onHand = new Decimal((bal._sum.delta ?? 0).toString());
        if (onHand.lt(l.quantity)) {
          throw new HttpError(409, `Insufficient stock for ${product.name}: ${onHand.toString()} ${product.unit} available`);
        }
        if (l.lotId) {
          // atomic conditional decrement: fails if the roll has less than requested
          const updated = await tx.textileLot.updateMany({
            where: { id: l.lotId, businessId, productId: product.id, remainingLength: { gte: l.quantity } },
            data: { remainingLength: { decrement: l.quantity } },
          });
          if (updated.count !== 1) throw new HttpError(409, "Roll has insufficient remaining length");
        }
      }

      // ---- sequential numbering (row-locked by the transaction) ----
      const docType = gstRegistered ? "TAX_INVOICE" : "BILL_OF_SUPPLY";
      const fy = financialYear(new Date(), business.financialYearStartMonth);
      const prefix = settings.invoicePrefix ?? "INV";
      await tx.numberSequence.upsert({
        where: { businessId_docType_financialYear: { businessId, docType, financialYear: fy } },
        create: { businessId, docType, financialYear: fy, prefix, next: 1 },
        update: {},
      });
      const seq = await tx.numberSequence.update({
        where: { businessId_docType_financialYear: { businessId, docType, financialYear: fy } },
        data: { next: { increment: 1 } },
      });
      const number = formatInvoiceNumber(seq.prefix, fy, seq.next - 1);

      const total = new Decimal(calc.grandTotal);
      invoiceNumberForSms = formatInvoiceNumber(seq.prefix, fy, seq.next - 1);
      invoiceTotalForSms = total.toString();
      const payments = body.payFullWith
        ? [{ method: body.payFullWith, amount: calc.grandTotal, reference: undefined as string | undefined }]
        : body.payments;
      const paid = payments.reduce((a, p) => a.plus(p.amount), new Decimal(0));
      if (paid.gt(total)) throw new HttpError(422, "Payments exceed invoice total");
      if (paid.lt(total) && !customer) throw new HttpError(422, "Walk-in sales must be paid in full; select a customer for credit");

      const inv = await tx.invoice.create({
        data: {
          businessId,
          customerId: customer?.id,
          docType,
          number,
          financialYear: fy,
          placeOfSupply,
          subtotal: calc.subtotal,
          discountTotal: calc.discountTotal,
          taxableTotal: calc.taxableTotal,
          cgst: calc.cgst,
          sgst: calc.sgst,
          igst: calc.igst,
          cess: calc.cess,
          roundOff: calc.roundOff,
          grandTotal: calc.grandTotal,
          notes: body.notes,
          createdById: userId,
          items: {
            create: priced.map(({ l, product, variant, unitPrice }, i) => ({
              businessId,
              productId: product.id,
              variantId: variant?.id,
              lotId: l.lotId,
              description: variant ? `${product.name} (${[variant.size, variant.colour].filter(Boolean).join("/")})` : product.name,
              hsn: product.hsn,
              quantity: l.quantity,
              unit: product.unit,
              unitPrice,
              discount: calc.lines[i].discount,
              taxableValue: calc.lines[i].taxableValue,
              gstRate: gstRegistered ? product.gstRate : 0,
              cgst: calc.lines[i].cgst,
              sgst: calc.lines[i].sgst,
              igst: calc.lines[i].igst,
              cess: calc.lines[i].cess,
              total: calc.lines[i].total,
            })),
          },
          payments: {
            create: payments.map((p) => ({
              businessId, amount: p.amount, method: p.method, reference: p.reference, createdById: userId,
            })),
          },
        },
        include: { items: true, payments: true },
      });

      await tx.stockMovement.createMany({
        data: priced.map(({ l, product, variant }) => ({
          businessId,
          locationId: location.id,
          productId: product.id,
          variantId: variant?.id,
          lotId: l.lotId,
          delta: new Decimal(l.quantity).neg().toString(),
          unit: product.unit,
          reason: "SALE" as const,
          refType: "Invoice",
          refId: inv.id,
          createdById: userId,
        })),
      });

      await tx.idempotencyKey.create({ data: { businessId, key, payloadHash, resourceId: inv.id } });
      await audit(req.auth, "invoice.issue", "Invoice", inv.id, { number, total: calc.grandTotal }, tx);
      return inv;
    }, { timeout: 15000 });

    const delivery = await sendInvoiceSms({
      customerPhone: customerPhone,
      invoiceNumber: invoiceNumberForSms ?? invoice.number,
      total: invoiceTotalForSms ?? invoice.grandTotal.toString(),
    });

    res.status(201).json({ ...invoice, delivery });
  } catch (e) {
    // two concurrent requests with the same key: the loser hits the unique constraint
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Duplicate request in progress - retry to fetch the existing result");
    }
    throw e;
  }
}));

r.get("/", wrap(async (req, res) => {
  const take = Math.min(Number(req.query.limit ?? 25), 100);
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const where = { businessId: req.auth.businessId };
  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({ where, orderBy: { createdAt: "desc" }, take, skip: (page - 1) * take, include: { customer: true } }),
    prisma.invoice.count({ where }),
  ]);
  res.json({ rows, total, page, pageSize: take });
}));

r.get("/:id", wrap(async (req, res) => {
  const inv = await prisma.invoice.findFirst({
    where: { id: req.params.id, businessId: req.auth.businessId },
    include: { items: true, payments: true, customer: true },
  });
  if (!inv) return res.status(404).json({ error: "Not found" });
  res.json(inv);
}));

// Record a later payment against a credit invoice.
r.post("/:id/payments", requireRole("OWNER", "CASHIER", "ACCOUNTANT"), wrap(async (req, res) => {
  const p = paymentSchema.parse(req.body);
  const out = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findFirst({
      where: { id: req.params.id, businessId: req.auth.businessId },
      include: { payments: true },
    });
    if (!inv) throw new HttpError(404, "Invoice not found");
    if (inv.status !== "ISSUED") throw new HttpError(409, "Invoice is not open for payment");
    const paid = inv.payments.reduce((a, x) => a.plus(x.amount.toString()), new Decimal(0));
    if (paid.plus(p.amount).gt(inv.grandTotal.toString())) throw new HttpError(422, "Payment exceeds outstanding balance");
    const pay = await tx.payment.create({
      data: { businessId: req.auth.businessId, invoiceId: inv.id, amount: p.amount, method: p.method, reference: p.reference, createdById: req.auth.userId },
    });
    await audit(req.auth, "payment.record", "Payment", pay.id, { invoice: inv.number, amount: p.amount }, tx);
    return pay;
  });
  res.status(201).json(out);
}));

export default r;
