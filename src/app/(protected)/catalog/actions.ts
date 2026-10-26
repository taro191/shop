"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { barcodeOwner } from "@/lib/barcodes";

/** The store product created from a catalog entry — enough for callers (POS cart,
 * receiving list, scanner) to use it right away without reloading. */
export type AddedProduct = {
  id: string;
  name: string;
  unit: string;
  category: string;
  barcode: string | null;
  costPrice: number;
  sellPrice: number;
  quantity: number;
};

export type CatalogAddState = { error?: string; ok?: boolean; product?: AddedProduct } | null;

const schema = z.object({
  catalogId: z.string().min(1),
  costPrice: z.coerce.number().min(0, "ราคาทุนต้องไม่ติดลบ"),
  sellPrice: z.coerce.number().min(0, "ราคาขายต้องไม่ติดลบ"),
  quantity: z.coerce.number().int("จำนวนต้องเป็นจำนวนเต็ม").min(0, "จำนวนต้องไม่ติดลบ"),
});

/** Copies a shared-catalog entry into the store's own product list, with the
 * store's own prices and opening stock. */
export async function addFromCatalogAction(_prev: CatalogAddState, formData: FormData): Promise<CatalogAddState> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = schema.safeParse({
    catalogId: formData.get("catalogId"),
    costPrice: formData.get("costPrice") || 0,
    sellPrice: formData.get("sellPrice"),
    quantity: formData.get("quantity") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const item = await prisma.catalogProduct.findUnique({ where: { id: parsed.data.catalogId } });
  if (!item) return { error: "ไม่พบสินค้านี้ในคลังสินค้ากลาง" };

  if (item.barcode) {
    const owner = await barcodeOwner(session.storeId, item.barcode);
    if (owner) return { error: `ร้านมีสินค้าบาร์โค้ดนี้แล้ว ("${owner}")` };
  }

  const product = await prisma.product.create({
    data: {
      storeId: session.storeId,
      name: item.name,
      category: item.category,
      unit: item.unit,
      barcode: item.barcode,
      imageUrl: item.imageUrl,
      groupKey: item.groupKey,
      costPrice: parsed.data.costPrice,
      sellPrice: parsed.data.sellPrice,
      quantity: parsed.data.quantity,
    },
  });

  const actingUser = await prisma.user.findUnique({ where: { id: session.userId } });
  await logAudit({
    storeId: session.storeId,
    userId: session.userId,
    userName: actingUser?.name ?? "ไม่ทราบชื่อ",
    action: "product.create",
    entityType: "Product",
    entityId: product.id,
    summary: `เพิ่มสินค้า "${product.name}" จากคลังสินค้ากลาง`,
  });

  revalidatePath("/catalog");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  revalidatePath("/stock");
  revalidatePath("/receive");
  revalidatePath("/sell");
  return {
    ok: true,
    product: {
      id: product.id,
      name: product.name,
      unit: product.unit,
      category: product.category,
      barcode: product.barcode,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      quantity: product.quantity,
    },
  };
}

/** Adds catalog items — a scanned product and its other sizes — to the store in one go,
 * with no price and no stock yet (the stock page then asks for a price). Items the store
 * already has, by barcode or name, are skipped. */
export async function addCatalogItemsToStoreAction(catalogIds: string[]): Promise<{ added: AddedProduct[] }> {
  const session = await getSession();
  if (!session || catalogIds.length === 0) return { added: [] };

  const items = await prisma.catalogProduct.findMany({ where: { id: { in: catalogIds.slice(0, 20) } } });
  const added: AddedProduct[] = [];
  for (const item of items) {
    if (item.barcode && (await barcodeOwner(session.storeId, item.barcode))) continue;
    if (await prisma.product.findFirst({ where: { storeId: session.storeId, name: item.name }, select: { id: true } })) continue;
    try {
      const product = await prisma.product.create({
        data: {
          storeId: session.storeId,
          name: item.name,
          category: item.category,
          unit: item.unit,
          barcode: item.barcode,
          imageUrl: item.imageUrl,
          groupKey: item.groupKey,
          costPrice: 0,
          sellPrice: 0,
          quantity: 0,
        },
      });
      added.push({
        id: product.id,
        name: product.name,
        unit: product.unit,
        category: product.category,
        barcode: product.barcode,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
        quantity: product.quantity,
      });
    } catch {
      // A concurrent scan added the same barcode first.
    }
  }
  if (added.length === 0) return { added };

  const actingUser = await prisma.user.findUnique({ where: { id: session.userId } });
  for (const product of added) {
    await logAudit({
      storeId: session.storeId,
      userId: session.userId,
      userName: actingUser?.name ?? "ไม่ทราบชื่อ",
      action: "product.create",
      entityType: "Product",
      entityId: product.id,
      summary: `เพิ่มสินค้า "${product.name}" จากคลังสินค้ากลาง (ยังไม่ตั้งราคา)`,
    });
  }

  for (const path of ["/catalog", "/inventory", "/dashboard", "/search", "/stock", "/receive", "/sell"]) revalidatePath(path);
  return { added };
}
