import { Worker } from "bullmq";
import IORedis from "ioredis";
import fs from "node:fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { prisma } from "@app/database";
import { extractedInvoiceSchema, validateExtraction } from "@app/shared";
import { AnthropicProvider, type LlmProvider } from "./llm";
import { EXTRACTION_SYSTEM } from "./prompt";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const storageDir = process.env.STORAGE_DIR ?? "./storage";
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) console.warn("ANTHROPIC_API_KEY is not set - extraction jobs will fail until it is.");

const llm: LlmProvider = new AnthropicProvider(apiKey ?? "", process.env.EXTRACTION_MODEL ?? "claude-sonnet-5-5");

function parseJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Model did not return JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function processJob(jobId: string) {
  const job = await prisma.extractionJob.findUniqueOrThrow({ where: { id: jobId }, include: { document: true } });
  if (job.status === "NEEDS_REVIEW" || job.status === "APPROVED") return; // idempotent re-run

  await prisma.extractionJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING", startedAt: new Date(), attempts: { increment: 1 }, modelVersion: llm.version },
  });

  const buf = await fs.readFile(path.resolve(storageDir, job.document.storageKey));

  // 1) text-first for digital PDFs; 2) otherwise hand the scan/photo to the vision-capable model
  let text: string | undefined;
  if (job.document.mimeType === "application/pdf") {
    const parsed = await pdfParse(buf);
    if (parsed.text.trim().length > 200) text = parsed.text.slice(0, 60_000);
  }
  const raw = await llm.complete({
    system: EXTRACTION_SYSTEM,
    text,
    file: text ? undefined : { mediaType: job.document.mimeType, base64: buf.toString("base64") },
  });

  const data = extractedInvoiceSchema.parse(parseJson(raw)); // strict schema or the job fails & retries
  const issues = validateExtraction(data);

  // duplicate candidate check (same supplier GSTIN + invoice number)
  if (data.supplierGstin) {
    const dup = await prisma.purchaseInvoice.findFirst({
      where: { businessId: job.businessId, vendorGstin: data.supplierGstin, invoiceNumber: data.invoiceNumber },
    });
    if (dup) issues.push({ field: "duplicate", severity: "warning", message: "A purchase with this supplier and invoice number already exists" });
  }

  await prisma.$transaction([
    prisma.extractionResult.upsert({
      where: { jobId },
      create: { businessId: job.businessId, jobId, data: data as object, confidence: data.confidence, issues },
      update: { data: data as object, confidence: data.confidence, issues },
    }),
    prisma.extractionJob.update({ where: { id: jobId }, data: { status: "NEEDS_REVIEW", finishedAt: new Date(), error: null } }),
  ]);
}

const worker = new Worker<{ jobId: string }>(
  "extraction",
  async (j) => processJob(j.data.jobId),
  {
    connection: new IORedis(redisUrl, { maxRetriesPerRequest: null }),
    concurrency: 2, // cap parallel model calls (cost / rate control)
    limiter: { max: 20, duration: 60_000 },
  },
);

worker.on("failed", async (j, err) => {
  console.error("job failed", j?.id, err.message);
  // mark FAILED only once retries are exhausted
  if (j && j.attemptsMade >= (j.opts.attempts ?? 1)) {
    await prisma.extractionJob.update({ where: { id: j.data.jobId }, data: { status: "FAILED", error: err.message.slice(0, 500), finishedAt: new Date() } });
  }
});
console.log("Extraction worker running");
