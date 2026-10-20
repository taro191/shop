-- AlterTable
ALTER TABLE `BillLineItem` ADD COLUMN `unitSize` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `SaleLineItem` ADD COLUMN `packName` VARCHAR(191) NULL,
    ADD COLUMN `packQty` INTEGER NULL;

-- CreateTable
CREATE TABLE `ProductPack` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `barcode` VARCHAR(191) NULL,
    `sellPrice` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductPack_productId_idx`(`productId`),
    UNIQUE INDEX `ProductPack_storeId_barcode_key`(`storeId`, `barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductPack` ADD CONSTRAINT `ProductPack_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductPack` ADD CONSTRAINT `ProductPack_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
