-- AlterTable
ALTER TABLE `CatalogProduct` ADD COLUMN `groupKey` VARCHAR(191) NULL,
    ADD COLUMN `imageUrl` VARCHAR(500) NULL,
    ADD COLUMN `onlineCheckedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `groupKey` VARCHAR(191) NULL,
    ADD COLUMN `imageUrl` VARCHAR(500) NULL;

-- CreateIndex
CREATE INDEX `CatalogProduct_groupKey_idx` ON `CatalogProduct`(`groupKey`);

-- CreateIndex
CREATE INDEX `Product_storeId_groupKey_idx` ON `Product`(`storeId`, `groupKey`);
