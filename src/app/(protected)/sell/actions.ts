"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatStock, packPrice } from "@/lib/packs";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        /** Sold by this pack (ลัง/แพ็ค): quantity is a number of packs. */
        packId: z.string().min(1).optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "ตะกร้าว่าง กรุณาเพิ่มสินค้าก่อนขาย"),
  method: z.enum(["CASH", "TRANSFER"]),
  customerId: z.string().min(1).optional(),
  pointsToRedeem: z.number().int().min(0).optional(),
  branchId: z.string().min(1).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutResult =
  | { ok: true; receipt: {
        id: string;
        amount: number;
        method: "CASH" | "TRANSFER";
        soldAt: string;
        lines: { name: string; unit: string; quantity: number; unitPrice: number; subtotal: number }[];
        discountAmount: number;
        pointsEarned: number;
        pointsRedeemed: number;
        customerName: string | null;
        invoiceNo: number | null;
        taxId: string | null;
      } }
  | { ok: false; error: string };

/** A checkout failure that is safe to show verbatim to the cashier (stock, validation). */
class CheckoutError extends Error {}

/** Loyalty rule (default, no per-store config yet): spend ฿1 (after discount), earn
 * 1 point. Redeem points 1:1 as a baht discount, capped by both the customer's
 * balance and the cart subtotal (can't go negative). */
export async function checkoutSale(input: CheckoutInput): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  // Merge duplicate lines (e.g. the same barcode scanned twice) before touching stock.
  // A product sold both singly and by the pack stays two lines.
  const merged = new Map<string, { productId: string; packId: string | null; quantity: number }>();
  for (const item of parsed.data.items) {
    const key = `${item.productId}:${item.packId ?? ""}`;
    const existing = merged.get(key);
    merged.set(key, { productId: item.productId, packId: item.packId ?? null, quantity: (existing?.quantity ?? 0) + item.quantity });
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: [...new Set([...merged.values()].map((m) => m.productId))] }, storeId: session.storeId },
        include: { packs: true },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const lineItemsData: {
        productId: string;
        quantity: number;
        unitPrice: number;
        unitCost: number;
        subtotal: number;
        packName: string | null;
        packQty: number | null;
      }[] = [];
      const lines: { name: string; unit: string; quantity: number; unitPrice: number; subtotal: number }[] = [];
      // Stock to take per product, in base units, across its single and pack lines.
      const demand = new Map<string, number>();

      for (const { productId, packId, quantity } of merged.values()) {
        const product = productMap.get(productId);
        if (!product) throw new CheckoutError("มีสินค้าบางรายการที่ไม่พบในระบบ กรุณารีเฟรชและลองใหม่");
        const pack = packId ? product.packs.find((p) => p.id === packId) : null;
        if (packId && !pack) throw new CheckoutError(`หน่วยบรรจุของ "${product.name}" ถูกลบไปแล้ว กรุณารีเฟรชและลองใหม่`);

        const baseQty = quantity * (pack?.size ?? 1);
        const price = pack ? packPrice(pack, product.sellPrice) : product.sellPrice;
        const lineSubtotal = price * quantity;
        subtotal += lineSubtotal;
        demand.set(productId, (demand.get(productId) ?? 0) + baseQty);
        lineItemsData.push({
          productId,
          quantity: baseQty,
          unitPrice: lineSubtotal / baseQty,
          unitCost: product.costPrice,
          subtotal: lineSubtotal,
          packName: pack?.name ?? null,
          packQty: pack ? quantity : null,
        });
        lines.push({
          name: product.name,
          unit: pack ? `${pack.name} (${pack.size} ${product.unit})` : product.unit,
          quantity,
          unitPrice: price,
          subtotal: lineSubtotal,
        });
      }

      // Atomic, race-safe stock decrement: the WHERE clause re-checks quantity at
      // write time, so two simultaneous checkouts can never oversell the same item.
      for (const [productId, quantity] of demand) {
        const result = await tx.product.updateMany({
          where: { id: productId, storeId: session.storeId, quantity: { gte: quantity } },
          data: { quantity: { decrement: quantity } },
        });
        if (result.count === 0) {
          const product = productMap.get(productId);
          const left = product ? formatStock(product.quantity, product.unit, product.packs) : "0";
          throw new CheckoutError(`${product?.name ?? "สินค้า"} มีไม่พอในสต๊อก (เหลือ ${left})`);
        }
      }

      // VAT-registered stores get a sequential, gap-free tax-invoice number per Thai
      // law. The update happens first so Postgres's row lock on Store serializes
      // concurrent checkouts — the returned post-increment value minus one is this
      // sale's number, and no two sales can ever get the same one.
      let invoiceNo: number | null = null;
      let taxId: string | null = null;
      const store = await tx.store.findUnique({ where: { id: session.storeId }, select: { vatRegistered: true, taxId: true } });
      if (store?.vatRegistered) {
        const updatedStore = await tx.store.update({
          where: { id: session.storeId },
          data: { nextInvoiceNo: { increment: 1 } },
        });
        invoiceNo = updatedStore.nextInvoiceNo - 1;
        taxId = store.taxId;
      }

      // Branch is optional (stores that haven't set up multi-branch just pass none).
      let branchId: string | null = null;
      if (parsed.data.branchId) {
        const branch = await tx.branch.findFirst({ where: { id: parsed.data.branchId, storeId: session.storeId } });
        if (!branch) throw new CheckoutError("ไม่พบสาขาที่เลือก");
        branchId = branch.id;
      }

      // Loyalty: validate the customer belongs to this store and cap redemption.
      let customer: { id: string; name: string; points: number } | null = null;
      if (parsed.data.customerId) {
        const c = await tx.customer.findFirst({ where: { id: parsed.data.customerId, storeId: session.storeId } });
        if (!c) throw new CheckoutError("ไม่พบข้อมูลลูกค้าที่เลือก");
        customer = c;
      }

      const requestedRedeem = parsed.data.pointsToRedeem ?? 0;
      const discountAmount = customer ? Math.min(requestedRedeem, customer.points, Math.floor(subtotal)) : 0;
      const amount = subtotal - discountAmount;
      const pointsEarned = customer ? Math.floor(amount) : 0;

      if (customer && (discountAmount > 0 || pointsEarned > 0)) {
        await tx.customer.update({ where: { id: customer.id }, data: { points: { increment: pointsEarned - discountAmount } } });
        if (discountAmount > 0) {
          await tx.loyaltyEntry.create({ data: { customerId: customer.id, type: "REDEEM", points: discountAmount, note: "แลกส่วนลดตอนชำระเงิน" } });
        }
        if (pointsEarned > 0) {
          await tx.loyaltyEntry.create({ data: { customerId: customer.id, type: "EARN", points: pointsEarned, note: "ได้รับจากการซื้อสินค้า" } });
        }
      }

      const summary = lines.map((l, i) => `${l.name} x${l.quantity}${lineItemsData[i].packName ? ` ${lineItemsData[i].packName}` : ""}`).join(", ");
      const created = await tx.incomeTransaction.create({
        data: {
          storeId: session.storeId,
          items: summary,
          method: parsed.data.method,
          amount,
          customerId: customer?.id,
          pointsEarned,
          pointsRedeemed: discountAmount,
          discountAmount,
          branchId,
          invoiceNo,
          lineItems: { create: lineItemsData },
        },
      });

      return {
        id: created.id,
        amount,
        method: created.method,
        soldAt: created.soldAt,
        lines,
        discountAmount,
        pointsEarned,
        pointsRedeemed: discountAmount,
        customerName: customer?.name ?? null,
        invoiceNo,
        taxId,
      };
    });

    revalidatePath("/sell");
    revalidatePath("/income");
    revalidatePath("/inventory");
    revalidatePath("/search");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidatePath("/customers");

    return {
      ok: true,
      receipt: {
        id: transaction.id,
        amount: transaction.amount,
        method: transaction.method,
        soldAt: transaction.soldAt.toISOString(),
        lines: transaction.lines,
        discountAmount: transaction.discountAmount,
        pointsEarned: transaction.pointsEarned,
        pointsRedeemed: transaction.pointsRedeemed,
        customerName: transaction.customerName,
        invoiceNo: transaction.invoiceNo,
        taxId: transaction.taxId,
      },
    };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    console.error("checkoutSale failed", e);
    return { ok: false, error: "บันทึกการขายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }
}
