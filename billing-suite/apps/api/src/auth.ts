import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma, type Role } from "@app/database";
import { env } from "./env";

export interface AuthCtx {
  userId: string;
  businessId: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthCtx;
    }
  }
}

export const signToken = (userId: string, businessId: string) =>
  jwt.sign({ sub: userId, bid: businessId }, env.JWT_SECRET, { expiresIn: "12h" });

/**
 * Authenticates the token, then re-checks the membership in the database on every
 * request (so removed users lose access immediately). The business is derived from
 * the membership - client-supplied business ids are never trusted.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const h = req.header("authorization");
    if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
    const payload = jwt.verify(h.slice(7), env.JWT_SECRET) as { sub: string; bid: string };
    const m = await prisma.membership.findUnique({
      where: { userId_businessId: { userId: payload.sub, businessId: payload.bid } },
    });
    if (!m || !m.active) return res.status(403).json({ error: "Membership inactive" });
    req.auth = { userId: m.userId, businessId: m.businessId, role: m.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };

export async function audit(
  ctx: AuthCtx,
  action: string,
  entity: string,
  entityId?: string,
  summary?: object,
  tx: Pick<typeof prisma, "auditLog"> = prisma,
) {
  await tx.auditLog.create({
    data: { businessId: ctx.businessId, actorId: ctx.userId, action, entity, entityId, summary },
  });
}
