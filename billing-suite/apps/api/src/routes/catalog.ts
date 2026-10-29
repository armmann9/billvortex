import { Router } from "express";
import { prisma } from "@app/database";
import { customerSchema, productSchema } from "@app/shared";
import { audit, requireRole } from "../auth";

const r = Router();
const wrap = (fn: (req: any, res: any) => Promise<unknown>) => (req: any, res: any, next: any) =>
  fn(req, res).catch(next);

// Search by name / SKU / barcode (barcode scanners type the code + Enter)
r.get("/products", wrap(async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const products = await prisma.product.findMany({
    where: {
      businessId: req.auth.businessId,
      active: true,
      ...(q
        ? { OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { barcode: q },
          ] }
        : {}),
    },
    include: { variants: true },
    take: 30,
    orderBy: { name: "asc" },
  });
  res.json(products);
}));

r.post("/products", requireRole("OWNER", "INVENTORY_MANAGER"), wrap(async (req, res) => {
  const b = productSchema.parse(req.body);
  const p = await prisma.product.create({ data: { ...b, businessId: req.auth.businessId } });
  await audit(req.auth, "product.create", "Product", p.id);
  res.status(201).json(p);
}));

r.post("/products/:id/variants", requireRole("OWNER", "INVENTORY_MANAGER"), wrap(async (req, res) => {
  const product = await prisma.product.findFirst({ where: { id: req.params.id, businessId: req.auth.businessId } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  const { size, colour, style, sku, barcode, salePrice } = req.body ?? {};
  const v = await prisma.productVariant.create({
    data: { businessId: req.auth.businessId, productId: product.id, size, colour, style, sku, barcode, salePrice },
  });
  res.status(201).json(v);
}));

r.get("/customers", wrap(async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  res.json(await prisma.customer.findMany({
    where: { businessId: req.auth.businessId, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
    take: 30,
    orderBy: { name: "asc" },
  }));
}));

r.post("/customers", requireRole("OWNER", "CASHIER", "ACCOUNTANT"), wrap(async (req, res) => {
  const b = customerSchema.parse(req.body);
  const c = await prisma.customer.create({ data: { ...b, businessId: req.auth.businessId } });
  await audit(req.auth, "customer.create", "Customer", c.id);
  res.status(201).json(c);
}));

export default r;
