-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ACCOUNTANT', 'INVENTORY_MANAGER', 'CASHIER', 'VIEWER');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('TAX_INVOICE', 'BILL_OF_SUPPLY', 'RECEIPT', 'ESTIMATE', 'DELIVERY_CHALLAN', 'CREDIT_NOTE', 'DEBIT_NOTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'GATEWAY');

-- CreateEnum
CREATE TYPE "MovementReason" AS ENUM ('OPENING', 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'NEEDS_REVIEW', 'APPROVED', 'FAILED');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gstin" TEXT,
    "stateCode" TEXT NOT NULL,
    "address" TEXT,
    "financialYearStartMonth" INTEGER NOT NULL DEFAULT 4,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "gstin" TEXT,
    "stateCode" TEXT,
    "address" TEXT,
    "creditLimit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gstin" TEXT,
    "stateCode" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "design" TEXT,
    "hsn" TEXT,
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxCategory" TEXT NOT NULL DEFAULT 'TAXABLE',
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "isFabric" BOOLEAN NOT NULL DEFAULT false,
    "salePrice" DECIMAL(14,2) NOT NULL,
    "wholesalePrice" DECIMAL(14,2),
    "costPrice" DECIMAL(14,2),
    "reorderLevel" DECIMAL(14,3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT,
    "colour" TEXT,
    "style" TEXT,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "salePrice" DECIMAL(14,2),

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLocation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StockLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextileLot" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "rollCode" TEXT NOT NULL,
    "shade" TEXT,
    "colour" TEXT,
    "width" DECIMAL(8,2),
    "unit" TEXT NOT NULL DEFAULT 'MTR',
    "originalLength" DECIMAL(14,3) NOT NULL,
    "remainingLength" DECIMAL(14,3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextileLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "lotId" TEXT,
    "delta" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "reason" "MovementReason" NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "docType" "DocType" NOT NULL,
    "number" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "placeOfSupply" TEXT NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "discountTotal" DECIMAL(14,2) NOT NULL,
    "taxableTotal" DECIMAL(14,2) NOT NULL,
    "cgst" DECIMAL(14,2) NOT NULL,
    "sgst" DECIMAL(14,2) NOT NULL,
    "igst" DECIMAL(14,2) NOT NULL,
    "cess" DECIMAL(14,2) NOT NULL,
    "roundOff" DECIMAL(14,2) NOT NULL,
    "grandTotal" DECIMAL(14,2) NOT NULL,
    "refInvoiceId" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "lotId" TEXT,
    "description" TEXT NOT NULL,
    "hsn" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2) NOT NULL,
    "taxableValue" DECIMAL(14,2) NOT NULL,
    "gstRate" DECIMAL(5,2) NOT NULL,
    "cgst" DECIMAL(14,2) NOT NULL,
    "sgst" DECIMAL(14,2) NOT NULL,
    "igst" DECIMAL(14,2) NOT NULL,
    "cess" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoice" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "vendorGstin" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "totalTax" DECIMAL(14,2) NOT NULL,
    "grandTotal" DECIMAL(14,2) NOT NULL,
    "approvalState" TEXT NOT NULL DEFAULT 'DRAFT',
    "documentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoiceItem" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "hsn" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT,
    "rate" DECIMAL(14,2) NOT NULL,
    "taxableValue" DECIMAL(14,2) NOT NULL,
    "gstRate" DECIMAL(5,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "lineTotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "PurchaseInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionJob" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "modelVersion" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionResult" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "confidence" JSONB NOT NULL,
    "issues" JSONB NOT NULL,
    "corrections" JSONB,
    "reviewState" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "note" TEXT,
    "attachmentKey" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "docType" "DocType" NOT NULL,
    "financialYear" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "next" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membership_businessId_idx" ON "Membership"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_businessId_key" ON "Membership"("userId", "businessId");

-- CreateIndex
CREATE INDEX "Customer_businessId_name_idx" ON "Customer"("businessId", "name");

-- CreateIndex
CREATE INDEX "Vendor_businessId_name_idx" ON "Vendor"("businessId", "name");

-- CreateIndex
CREATE INDEX "Product_businessId_barcode_idx" ON "Product"("businessId", "barcode");

-- CreateIndex
CREATE INDEX "Product_businessId_name_idx" ON "Product"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_businessId_sku_key" ON "Product"("businessId", "sku");

-- CreateIndex
CREATE INDEX "ProductVariant_businessId_barcode_idx" ON "ProductVariant"("businessId", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_businessId_sku_key" ON "ProductVariant"("businessId", "sku");

-- CreateIndex
CREATE INDEX "StockLocation_businessId_idx" ON "StockLocation"("businessId");

-- CreateIndex
CREATE INDEX "TextileLot_businessId_productId_idx" ON "TextileLot"("businessId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "TextileLot_businessId_productId_rollCode_key" ON "TextileLot"("businessId", "productId", "rollCode");

-- CreateIndex
CREATE INDEX "StockMovement_businessId_productId_locationId_idx" ON "StockMovement"("businessId", "productId", "locationId");

-- CreateIndex
CREATE INDEX "StockMovement_businessId_refType_refId_idx" ON "StockMovement"("businessId", "refType", "refId");

-- CreateIndex
CREATE INDEX "Invoice_businessId_issueDate_idx" ON "Invoice"("businessId", "issueDate");

-- CreateIndex
CREATE INDEX "Invoice_businessId_customerId_idx" ON "Invoice"("businessId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_businessId_number_key" ON "Invoice"("businessId", "number");

-- CreateIndex
CREATE INDEX "InvoiceItem_businessId_invoiceId_idx" ON "InvoiceItem"("businessId", "invoiceId");

-- CreateIndex
CREATE INDEX "Payment_businessId_invoiceId_idx" ON "Payment"("businessId", "invoiceId");

-- CreateIndex
CREATE INDEX "Payment_businessId_paidAt_idx" ON "Payment"("businessId", "paidAt");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_businessId_vendorGstin_invoiceNumber_idx" ON "PurchaseInvoice"("businessId", "vendorGstin", "invoiceNumber");

-- CreateIndex
CREATE INDEX "PurchaseInvoiceItem_businessId_purchaseId_idx" ON "PurchaseInvoiceItem"("businessId", "purchaseId");

-- CreateIndex
CREATE INDEX "Document_businessId_idx" ON "Document"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_businessId_checksum_key" ON "Document"("businessId", "checksum");

-- CreateIndex
CREATE INDEX "ExtractionJob_businessId_status_idx" ON "ExtractionJob"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionResult_jobId_key" ON "ExtractionResult"("jobId");

-- CreateIndex
CREATE INDEX "Expense_businessId_date_idx" ON "Expense"("businessId", "date");

-- CreateIndex
CREATE INDEX "AuditLog_businessId_createdAt_idx" ON "AuditLog"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_businessId_entity_entityId_idx" ON "AuditLog"("businessId", "entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_businessId_docType_financialYear_key" ON "NumberSequence"("businessId", "docType", "financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_businessId_key_key" ON "IdempotencyKey"("businessId", "key");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLocation" ADD CONSTRAINT "StockLocation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextileLot" ADD CONSTRAINT "TextileLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoiceItem" ADD CONSTRAINT "PurchaseInvoiceItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionResult" ADD CONSTRAINT "ExtractionResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ExtractionJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
