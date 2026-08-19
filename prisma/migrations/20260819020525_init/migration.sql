-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "barcode" TEXT,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeTransaction" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseBill" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "billDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillLineItem" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "qtyLabel" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BillLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_storeId_idx" ON "User"("storeId");

-- CreateIndex
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- CreateIndex
CREATE INDEX "Product_storeId_name_idx" ON "Product"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_barcode_key" ON "Product"("storeId", "barcode");

-- CreateIndex
CREATE INDEX "Supplier_storeId_idx" ON "Supplier"("storeId");

-- CreateIndex
CREATE INDEX "SupplierPrice_productId_idx" ON "SupplierPrice"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPrice_productId_supplierId_key" ON "SupplierPrice"("productId", "supplierId");

-- CreateIndex
CREATE INDEX "IncomeTransaction_storeId_soldAt_idx" ON "IncomeTransaction"("storeId", "soldAt");

-- CreateIndex
CREATE INDEX "PurchaseBill_storeId_billDate_idx" ON "PurchaseBill"("storeId", "billDate");

-- CreateIndex
CREATE INDEX "BillLineItem_billId_idx" ON "BillLineItem"("billId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPrice" ADD CONSTRAINT "SupplierPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPrice" ADD CONSTRAINT "SupplierPrice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeTransaction" ADD CONSTRAINT "IncomeTransaction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBill" ADD CONSTRAINT "PurchaseBill_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBill" ADD CONSTRAINT "PurchaseBill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillLineItem" ADD CONSTRAINT "BillLineItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "PurchaseBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillLineItem" ADD CONSTRAINT "BillLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
