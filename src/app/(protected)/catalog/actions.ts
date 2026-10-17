"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export type CatalogAddState = { error?: string; ok?: boolean } | null;

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
    const existing = await prisma.product.findFirst({ where: { storeId: session.storeId, barcode: item.barcode } });
    if (existing) return { error: `ร้านมีสินค้าบาร์โค้ดนี้แล้ว ("${existing.name}")` };
  }

  const product = await prisma.product.create({
    data: {
      storeId: session.storeId,
      name: item.name,
      category: item.category,
      unit: item.unit,
      barcode: item.barcode,
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
  return { ok: true };
}
