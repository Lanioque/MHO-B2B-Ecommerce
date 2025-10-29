-- AlterTable
ALTER TABLE "Branch" ADD COLUMN "zohoContactId" TEXT,
ADD COLUMN "zohoSyncedAt" TIMESTAMP(3),
ADD COLUMN "zohoSyncError" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Branch_zohoContactId_key" ON "Branch"("zohoContactId");

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "zohoInvoiceId" TEXT;

