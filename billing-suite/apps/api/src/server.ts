import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { authenticate } from "./auth";
import { env } from "./env";
import { HttpError } from "./errors";
import authRoutes from "./routes/auth";
import catalogRoutes from "./routes/catalog";
import stockRoutes from "./routes/stock";
import invoiceRoutes from "./routes/invoices";
import reportRoutes from "./routes/reports";
import documentRoutes from "./routes/documents";

const app = express();
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);

// everything below requires an authenticated business member
app.use(authenticate);
app.use(catalogRoutes);
app.use("/stock", stockRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/reports", reportRoutes);
app.use("/documents", documentRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

app.listen(env.PORT, () => console.log(`API listening on :${env.PORT}`));
