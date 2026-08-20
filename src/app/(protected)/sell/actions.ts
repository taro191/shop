"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "ตะกร้าว่าง กรุณาเพิ่มสินค้าก่อนขาย"),
  method: z.enum(["CASH", "TRANSFER"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutResult =
  | { ok: true; receipt: {
        id: string;
        amount: number;
        method: "CASH" | "TRANSFER";
        soldAt: string;
        lines: { name: string; unit: string; quantity: number; unitPrice: number; subtotal: number }[];
      } }
  | { ok: false; error: string };

/** A checkout failure that is safe to show verbatim to the cashier (stock, validation). */
class CheckoutError extends Error {}

export async function checkoutSale(input: CheckoutInput): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  // Merge duplicate productIds (e.g. the same barcode scanned twice) before touching stock.
  const merged = new Map<string, number>();
  for (const item of parsed.data.items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: [...merged.keys()] }, storeId: session.storeId },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let amount = 0;
      const lineItemsData: { productId: string; quantity: number; unitPrice: number; unitCost: number; subtotal: number }[] = [];
      const lines: { name: string; unit: string; quantity: number; unitPrice: number; subtotal: number }[] = [];

      for (const [productId, quantity] of merged) {
        const product = productMap.get(productId);
        if (!product) throw new CheckoutError("มีสินค้าบางรายการที่ไม่พบในระบบ กรุณารีเฟรชและลองใหม่");
        const subtotal = product.sellPrice * quantity;
        amount += subtotal;
        lineItemsData.push({ productId, quantity, unitPrice: product.sellPrice, unitCost: product.costPrice, subtotal });
        lines.push({ name: product.name, unit: product.unit, quantity, unitPrice: product.sellPrice, subtotal });
      }

      // Atomic, race-safe stock decrement: the WHERE clause re-checks quantity at
      // write time, so two simultaneous checkouts can never oversell the same item.
      for (const [productId, quantity] of merged) {
        const result = await tx.product.updateMany({
          where: { id: productId, storeId: session.storeId, quantity: { gte: quantity } },
          data: { quantity: { decrement: quantity } },
        });
        if (result.count === 0) {
          const product = productMap.get(productId);
          throw new CheckoutError(
            `${product?.name ?? "สินค้า"} มีไม่พอในสต๊อก (เหลือ ${product?.quantity ?? 0} ${product?.unit ?? ""})`
          );
        }
      }

      const summary = lines.map((l) => `${l.name} x${l.quantity}`).join(", ");
      const created = await tx.incomeTransaction.create({
        data: {
          storeId: session.storeId,
          items: summary,
          method: parsed.data.method,
          amount,
          lineItems: { create: lineItemsData },
        },
      });

      return { id: created.id, amount, method: created.method, soldAt: created.soldAt, lines };
    });

    revalidatePath("/sell");
    revalidatePath("/income");
    revalidatePath("/inventory");
    revalidatePath("/search");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return {
      ok: true,
      receipt: {
        id: transaction.id,
        amount: transaction.amount,
        method: transaction.method,
        soldAt: transaction.soldAt.toISOString(),
        lines: transaction.lines,
      },
    };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    console.error("checkoutSale failed", e);
    return { ok: false, error: "บันทึกการขายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }
}
