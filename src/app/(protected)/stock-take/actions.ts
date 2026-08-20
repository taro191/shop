"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  reason: z.string().trim().optional(),
  adjustments: z.array(z.object({ productId: z.string().min(1), actualQty: z.number().int().min(0) })),
});

export type StockTakeInput = z.infer<typeof schema>;
export type StockTakeResult = { ok: true; changed: number } | { ok: false; error: string };

export async function submitStockTake(input: StockTakeInput): Promise<StockTakeResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  if (parsed.data.adjustments.length === 0) return { ok: true, changed: 0 };

  const productIds = parsed.data.adjustments.map((a) => a.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, storeId: session.storeId } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const toApply = parsed.data.adjustments.filter((a) => {
    const p = productMap.get(a.productId);
    return p && p.quantity !== a.actualQty;
  });
  if (toApply.length === 0) return { ok: true, changed: 0 };

  await prisma.$transaction(async (tx) => {
    for (const a of toApply) {
      const product = productMap.get(a.productId)!;
      await tx.stockAdjustment.create({
        data: {
          storeId: session.storeId,
          productId: a.productId,
          before: product.quantity,
          after: a.actualQty,
          reason: parsed.data.reason?.trim() || null,
        },
      });
      await tx.product.update({ where: { id: a.productId }, data: { quantity: a.actualQty } });
    }
  });

  revalidatePath("/stock-take");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  return { ok: true, changed: toApply.length };
}
