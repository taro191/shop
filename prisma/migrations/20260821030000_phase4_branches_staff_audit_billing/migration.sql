npm notice run grocery-shop@0.1.0 npx
npm notice run prisma migrate diff --from-schema C:/Users/Lenovo/AppData/Local/Temp/prevschema2/schema.prisma --to-schema ./prisma/schema.prisma --script
Loaded Prisma config from prisma.config.ts.

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "notifyWebhookUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "IncomeTransaction" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseBill" ADD COLUMN     "branchId" TEXT;

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_storeId_idx" ON "Branch"("storeId");

-- CreateIndex
CREATE INDEX "AuditLog_storeId_createdAt_idx" ON "AuditLog"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "IncomeTransaction_branchId_idx" ON "IncomeTransaction"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseBill_branchId_idx" ON "PurchaseBill"("branchId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeTransaction" ADD CONSTRAINT "IncomeTransaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBill" ADD CONSTRAINT "PurchaseBill_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill: every existing store gets one main branch, and its existing sales/
-- purchase bills (which predate branches) are tagged to it so branch filters
-- don't show a confusing "unassigned" bucket for stores that only ever had one
-- location. Existing User rows are left with branchId = NULL (unrestricted —
-- no more restrictive than before this migration).
INSERT INTO "Branch" ("id", "storeId", "name", "isMain", "createdAt")
SELECT gen_random_uuid()::text, "id", 'สาขาหลัก', true, now()
FROM "Store";

UPDATE "IncomeTransaction" t
SET "branchId" = b."id"
FROM "Branch" b
WHERE b."storeId" = t."storeId" AND b."isMain" = true AND t."branchId" IS NULL;

UPDATE "PurchaseBill" pb
SET "branchId" = b."id"
FROM "Branch" b
WHERE b."storeId" = pb."storeId" AND b."isMain" = true AND pb."branchId" IS NULL;
