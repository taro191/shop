-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "nextInvoiceNo" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "vatRegistered" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "IncomeTransaction" ADD COLUMN     "invoiceNo" INTEGER;
