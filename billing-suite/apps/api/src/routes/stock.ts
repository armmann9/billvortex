import { Router } from "express";
import { prisma } from "@app/database";
import { stockReceiptSchema } from "@app/shared";
import { audit, requireRole } from "../auth";

const r = Router();
const wrap = (fn: (req: any, res: any) => Promise<unknown>) => (req: any, res: any, next: any) =>
  fn(req, res).catch(next);

// Receive stock (and optionally register a fabric roll). Writes to the ledger only.
r.post("/receipts", requireRole("OWNER", "INVENTORY_MANAGER"), wrap(async (req, res) => {
  const b = stockReceiptSchema.parse(req.body);
  const out = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { id: b.productId, businessId: req.auth.businessId } });
    if (!product) return null;
    const location = await tx.stockLocation.findFirstOrThrow({
      where: { businessId: req.auth.businessId, isDefault: true },
    });
    let lotId: string | undefined;
    if (b.lot) {
      const lot = await tx.textileLot.create({
        data: {
          businessId: req.auth.businessId,
          productId: product.id,
          ...b.lot,
          unit: product.unit,
          originalLength: b.quantity,
          remainingLength: b.quantity,
        },
      });
      lotId = lot.id;
    }
    const m = await tx.stockMovement.create({
      data: {
        businessId: req.auth.businessId,
        locationId: location.id,
        productId: product.id,
        variantId: b.variantId,
        lotId,
        delta: b.quantity,
        unit: product.unit,
        reason: b.reason,
        createdById: req.auth.userId,
      },
    });
    await audit(req.auth, "stock.receive", "StockMovement", m.id, { qty: b.quantity }, tx);
    return m;
  });
  if (!out) return res.status(404).json({ error: "Product not found" });
  res.status(201).json(out);
}));

r.get("/balance/:productId", wrap(async (req, res) => {
  const agg = await prisma.stockMovement.aggregate({
    where: { businessId: req.auth.businessId, productId: req.params.productId },
    _sum: { delta: true },
  });
  const lots = await prisma.textileLot.findMany({
    where: { businessId: req.auth.businessId, productId: req.params.productId, remainingLength: { gt: 0 } },
  });
  res.json({ onHand: agg._sum.delta ?? "0", lots });
}));

r.get("/low", wrap(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { businessId: req.auth.businessId, reorderLevel: { not: null }, active: true },
  });
  const low = [];
  for (const p of products) {
    const s = await prisma.stockMovement.aggregate({
      where: { businessId: req.auth.businessId, productId: p.id },
      _sum: { delta: true },
    });
    const onHand = s._sum.delta ?? 0;
    if (p.reorderLevel && Number(onHand) <= Number(p.reorderLevel)) low.push({ product: p, onHand });
  }
  res.json(low);
}));

export default r;
