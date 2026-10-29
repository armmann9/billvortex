import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@app/database";
import { loginSchema, registerSchema } from "@app/shared";
import { signToken } from "../auth";
import { HttpError } from "../errors";

const r = Router();
const wrap = (fn: (req: any, res: any) => Promise<unknown>) => (req: any, res: any, next: any) =>
  fn(req, res).catch(next);

// Create a business workspace with its first (OWNER) user.
r.post("/register", wrap(async (req, res) => {
  const b = registerSchema.parse(req.body);
  if (await prisma.user.findUnique({ where: { email: b.email } })) {
    throw new HttpError(409, "Email already registered");
  }
  const passwordHash = await bcrypt.hash(b.password, 12);
  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: b.businessName,
        gstin: b.gstin,
        stateCode: b.stateCode,
        settings: { invoicePrefix: "INV", maxCashierDiscountPct: 5, roundToRupee: true },
      },
    });
    const user = await tx.user.create({ data: { email: b.email, name: b.name, passwordHash } });
    await tx.membership.create({ data: { userId: user.id, businessId: business.id, role: "OWNER" } });
    await tx.stockLocation.create({ data: { businessId: business.id, name: "Main Store", isDefault: true } });
    return { business, user };
  });
  res.status(201).json({ token: signToken(result.user.id, result.business.id), businessId: result.business.id });
}));

r.post("/login", wrap(async (req, res) => {
  const b = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: b.email } });
  // same message for unknown email / wrong password
  if (!user || !(await bcrypt.compare(b.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid credentials");
  }
  const m = await prisma.membership.findFirst({
    where: { userId: user.id, active: true, ...(b.businessId ? { businessId: b.businessId } : {}) },
  });
  if (!m) throw new HttpError(403, "No active business membership");
  res.json({ token: signToken(user.id, m.businessId), businessId: m.businessId, role: m.role });
}));

export default r;
