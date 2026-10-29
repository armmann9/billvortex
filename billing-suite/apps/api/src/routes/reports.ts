import { Router } from "express";
import { prisma } from "@app/database";
import { requireRole } from "../auth";

const r = Router();
const wrap = (fn: (req: any, res: any) => Promise<unknown>) => (req: any, res: any, next: any) =>
  fn(req, res).catch(next);

// Daily sales: totals, tax split, payment split. Defaults to today (server time).
r.get("/daily-sales", requireRole("OWNER", "ACCOUNTANT", "VIEWER", "CASHIER"), wrap(async (req, res) => {
  const day = req.query.date ? new Date(String(req.query.date)) : new Date();
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  const businessId = req.auth.businessId;

  const sales = await prisma.invoice.aggregate({
    where: { businessId, status: "ISSUED", issueDate: { gte: start, lt: end } },
    _sum: { subtotal: true, discountTotal: true, taxableTotal: true, cgst: true, sgst: true, igst: true, grandTotal: true },
    _count: true,
  });
  const byMethod = await prisma.payment.groupBy({
    by: ["method"],
    where: { businessId, paidAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  res.json({ date: start.toISOString().slice(0, 10), invoices: sales._count, totals: sales._sum, paymentSplit: byMethod });
}));

// GST summary for a date range, for accountant reconciliation (not a filed return).
r.get("/gst-summary", requireRole("OWNER", "ACCOUNTANT"), wrap(async (req, res) => {
  const from = new Date(String(req.query.from));
  const to = new Date(String(req.query.to));
  const rows = await prisma.invoice.groupBy({
    by: ["docType"],
    where: { businessId: req.auth.businessId, status: "ISSUED", issueDate: { gte: from, lte: to } },
    _sum: { taxableTotal: true, cgst: true, sgst: true, igst: true, cess: true, grandTotal: true },
    _count: true,
  });
  res.json(rows);
}));

export default r;
