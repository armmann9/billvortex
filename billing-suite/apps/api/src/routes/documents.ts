import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import Decimal from "decimal.js";
import { prisma } from "@app/database";
import { extractedInvoiceSchema, validateExtraction } from "@app/shared";
import { audit, requireRole } from "../auth";
import { extractionQueue } from "../queue";
import { saveFile } from "../storage";
import { HttpError } from "../errors";

const r = Router();
const wrap = (fn: (req: any, res: any) => Promise<unknown>) => (req: any, res: any, next: any) =>
  fn(req, res).catch(next);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

// Validate by file signature, not by the client-declared MIME type.
function sniff(buf: Buffer): string | null {
  if (buf.subarray(0, 4).toString() === "%PDF") return "application/pdf";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  return null;
}

r.post("/", requireRole("OWNER", "ACCOUNTANT", "INVENTORY_MANAGER"), upload.single("file"), wrap(async (req, res) => {
  if (!req.file) throw new HttpError(400, "file is required");
  const mime = sniff(req.file.buffer);
  if (!mime) throw new HttpError(415, "Only PDF, PNG or JPEG files are accepted");
  const { businessId, userId } = req.auth;

  const checksum = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
  const dup = await prisma.document.findUnique({ where: { businessId_checksum: { businessId, checksum } } });
  if (dup) return res.status(200).json({ documentId: dup.id, duplicate: true });

  const storageKey = `${businessId}/${checksum}`;
  await saveFile(storageKey, req.file.buffer);
  const doc = await prisma.document.create({
    data: { businessId, storageKey, fileName: req.file.originalname.slice(0, 200), mimeType: mime, sizeBytes: req.file.size, checksum, uploadedById: userId },
  });
  const job = await prisma.extractionJob.create({ data: { businessId, documentId: doc.id } });
  // jobId makes enqueueing idempotent
  await extractionQueue.add("extract", { jobId: job.id }, { jobId: job.id });
  await audit(req.auth, "document.upload", "Document", doc.id);
  res.status(202).json({ documentId: doc.id, jobId: job.id, status: "QUEUED" });
}));

r.get("/jobs/:jobId", wrap(async (req, res) => {
  const job = await prisma.extractionJob.findFirst({
    where: { id: req.params.jobId, businessId: req.auth.businessId },
    include: { result: true },
  });
  if (!job) return res.status(404).json({ error: "Not found" });
  res.json(job);
}));

/**
 * Human approval. The reviewer submits the (possibly corrected) data. We re-run the
 * deterministic validation server-side: errors block approval, warnings must be
 * acknowledged. Nothing the model said is trusted without this step.
 */
r.post("/jobs/:jobId/approve", requireRole("OWNER", "ACCOUNTANT"), wrap(async (req, res) => {
  const data = extractedInvoiceSchema.parse(req.body.data);
  const acknowledged: string[] = req.body.acknowledgedWarnings ?? [];
  const { businessId, userId } = req.auth;

  const issues = validateExtraction(data);
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length) return res.status(422).json({ error: "Fix validation errors first", issues: errors });
  const unacked = issues.filter((i) => i.severity === "warning" && !acknowledged.includes(i.field));
  if (unacked.length) return res.status(422).json({ error: "Acknowledge warnings first", issues: unacked });

  const out = await prisma.$transaction(async (tx) => {
    const job = await tx.extractionJob.findFirst({
      where: { id: req.params.jobId, businessId },
      include: { result: true, document: true },
    });
    if (!job?.result) throw new HttpError(404, "No extraction result");
    if (job.status === "APPROVED") throw new HttpError(409, "Already approved");

    const dup = await tx.purchaseInvoice.findFirst({
      where: { businessId, vendorGstin: data.supplierGstin ?? undefined, invoiceNumber: data.invoiceNumber },
    });
    if (dup && !acknowledged.includes("duplicate")) {
      throw new HttpError(409, "A purchase with this supplier/invoice number exists. Acknowledge 'duplicate' to proceed.");
    }

    const vendor = data.supplierGstin
      ? await tx.vendor.findFirst({ where: { businessId, gstin: data.supplierGstin } })
      : null; // never auto-create or merge master data

    const purchase = await tx.purchaseInvoice.create({
      data: {
        businessId,
        vendorId: vendor?.id,
        vendorName: data.supplierName,
        vendorGstin: data.supplierGstin,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: new Date(data.invoiceDate),
        subtotal: data.subtotal,
        totalTax: data.totalTax,
        grandTotal: data.grandTotal,
        documentId: job.documentId,
        createdById: userId,
        approvalState: "APPROVED", // stock is NOT updated here; goods receipt is a separate step
        items: {
          create: data.lines.map((l) => ({
            businessId,
            description: l.description,
            hsn: l.hsn,
            quantity: l.quantity,
            unit: l.unit,
            rate: l.rate,
            taxableValue: l.taxableValue,
            gstRate: l.gstRate,
            taxAmount: l.taxAmount,
            lineTotal: l.lineTotal,
          })),
        },
      },
    });

    // Record what the reviewer changed (feeds accuracy / correction-rate metrics)
    const changed = JSON.stringify(job.result.data) !== JSON.stringify(data);
    await tx.extractionResult.update({
      where: { id: job.result.id },
      data: { reviewState: "APPROVED", reviewedById: userId, corrections: changed ? (data as object) : undefined },
    });
    await tx.extractionJob.update({ where: { id: job.id }, data: { status: "APPROVED" } });
    await audit(req.auth, "purchase.approve", "PurchaseInvoice", purchase.id, { total: new Decimal(data.grandTotal).toFixed(2), corrected: changed }, tx);
    return purchase;
  });
  res.status(201).json(out);
}));

export default r;
