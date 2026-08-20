"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type ActionState = { error?: string } | null;

const productSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า"),
  category: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  barcode: z.string().trim().optional(),
  costPrice: z.coerce.number().min(0),
  sellPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(0),
  expiresAt: z.string().trim().optional(),
});

export async function addProductAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    unit: formData.get("unit"),
    barcode: formData.get("barcode") || undefined,
    costPrice: formData.get("costPrice"),
    sellPrice: formData.get("sellPrice"),
    quantity: formData.get("quantity"),
    expiresAt: formData.get("expiresAt") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const barcode = parsed.data.barcode || null;
  if (barcode) {
    const existing = await prisma.product.findFirst({ where: { storeId: session.storeId, barcode } });
    if (existing) return { error: "มีสินค้าที่ใช้บาร์โค้ดนี้อยู่แล้ว" };
  }

  await prisma.product.create({
    data: {
      storeId: session.storeId,
      name: parsed.data.name,
      category: parsed.data.category,
      unit: parsed.data.unit,
      barcode,
      costPrice: parsed.data.costPrice,
      sellPrice: parsed.data.sellPrice,
      quantity: parsed.data.quantity,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  return null;
}
