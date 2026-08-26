"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const REASON_LABEL: Record<string, string> = {
  EXPIRED: "หมดอายุ",
  DAMAGED: "ชำรุด",
  OTHER: "อื่นๆ",
};

const schema = z.object({
  productId: z.string().trim().min(1),
  reason: z.enum(["EXPIRED", "DAMAGED", "OTHER"]),
  quantity: z.number().int().positive(),
  note: z.string().trim().optional(),
});

export type WriteOffInput = z.infer<typeof schema>;
export type WriteOffResult = { ok: true } | { ok: false; error: string };

/** Quick single-product stock write-off for expired/damaged goods — a thin,
 * focused wrapper over the same StockAdjustment table stock-take uses, so both
 * flows show up together in inventory history. */
export async function writeOffStockAction(input: WriteOffInput): Promise<WriteOffResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const product = await prisma.product.findFirst({ where: { id: parsed.data.productId, storeId: session.storeId } });
  if (!product) return { ok: false, error: "ไม่พบสินค้านี้" };
  if (parsed.data.quantity > product.quantity) {
    return { ok: false, error: `มีในสต๊อกแค่ ${product.quantity} ${product.unit}` };
  }

  const after = product.quantity - parsed.data.quantity;
  const reasonLabel = REASON_LABEL[parsed.data.reason];
  const reason = parsed.data.note ? `${reasonLabel} - ${parsed.data.note}` : reasonLabel;

  await prisma.$transaction([
    prisma.stockAdjustment.create({
      data: { storeId: session.storeId, productId: product.id, before: product.quantity, after, reason },
    }),
    prisma.product.update({ where: { id: product.id }, data: { quantity: after } }),
  ]);

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  await logAudit({
    storeId: session.storeId,
    userId: session.userId,
    userName: user?.name ?? "ไม่ทราบชื่อ",
    action: "stock.write_off",
    entityType: "Product",
    entityId: product.id,
    summary: `ตัดสต๊อก "${product.name}" ${parsed.data.quantity} ${product.unit} (${reasonLabel})`,
  });

  revalidatePath("/write-off");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  revalidatePath("/stock-take");
  return { ok: true };
}
