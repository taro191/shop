import { prisma } from "@/lib/db";

/** Name of whatever already uses this barcode in the store (a product, or a pack of
 * one), or null if it's free. Product and pack barcodes share one namespace, so a
 * scan always resolves to exactly one thing. */
export async function barcodeOwner(storeId: string, barcode: string): Promise<string | null> {
  const [product, pack] = await Promise.all([
    prisma.product.findFirst({ where: { storeId, barcode }, select: { name: true } }),
    prisma.productPack.findFirst({ where: { storeId, barcode }, select: { name: true, product: { select: { name: true } } } }),
  ]);
  if (product) return product.name;
  if (pack) return `${pack.product.name} (${pack.name})`;
  return null;
}
