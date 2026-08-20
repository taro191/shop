"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type ActionState = { error?: string } | null;

const lineItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  unit: z.string().trim().min(1),
  unitPrice: z.number().min(0),
});

const createBillSchema = z.object({
  billNo: z.string().trim().min(1, "กรุณากรอกเลขที่บิล"),
  supplierId: z.string().trim().min(1, "กรุณาเลือกซัพพลายเออร์"),
  receivedNow: z.boolean(),
  lineItems: z.array(lineItemSchema).min(1, "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ"),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type CreateBillResult = { ok: true } | { ok: false; error: string };

/** Creates a purchase bill from real line items. If `receivedNow`, stock is
 * incremented immediately and the bill starts PENDING (received, unpaid);
 * otherwise it's a purchase order (ORDERED) that only affects stock once
 * someone calls receiveBillAction after the goods actually arrive. */
export async function createBill(input: CreateBillInput): Promise<CreateBillResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const parsed = createBillSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const supplier = await prisma.supplier.findFirst({ where: { id: parsed.data.supplierId, storeId: session.storeId } });
  if (!supplier) return { ok: false, error: "ไม่พบซัพพลายเออร์ที่เลือก" };

  const productIds = parsed.data.lineItems.map((l) => l.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, storeId: session.storeId } });
  const productMap = new Map(products.map((p) => [p.id, p]));
  if (products.length !== new Set(productIds).size) return { ok: false, error: "มีสินค้าบางรายการที่ไม่พบในระบบ" };

  const amount = parsed.data.lineItems.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  await prisma.$transaction(async (tx) => {
    await tx.purchaseBill.create({
      data: {
        storeId: session.storeId,
        billNo: parsed.data.billNo,
        supplierId: supplier.id,
        amount,
        status: parsed.data.receivedNow ? "PENDING" : "ORDERED",
        receivedAt: parsed.data.receivedNow ? new Date() : null,
        lineItems: {
          create: parsed.data.lineItems.map((l) => {
            const product = productMap.get(l.productId)!;
            return {
              productId: l.productId,
              name: product.name,
              qtyLabel: `${l.quantity} ${l.unit}`,
              quantity: l.quantity,
              unit: l.unit,
              unitPrice: l.unitPrice,
              subtotal: l.quantity * l.unitPrice,
            };
          }),
        },
      },
    });

    if (parsed.data.receivedNow) {
      for (const l of parsed.data.lineItems) {
        await tx.product.update({ where: { id: l.productId }, data: { quantity: { increment: l.quantity } } });
      }
    }
  });

  revalidatePath("/bills");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  return { ok: true };
}

/** Marks an ORDERED purchase order as received: increments stock for every line
 * item that has a numeric quantity, and moves the bill to PENDING (owed). */
export async function receiveBillAction(billId: string): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const bill = await prisma.purchaseBill.findFirst({
    where: { id: billId, storeId: session.storeId },
    include: { lineItems: true },
  });
  if (!bill) return { error: "ไม่พบบิลนี้" };
  if (bill.status !== "ORDERED") return { error: "บิลนี้รับสินค้าไปแล้ว" };

  await prisma.$transaction(async (tx) => {
    for (const li of bill.lineItems) {
      if (li.productId && li.quantity != null) {
        await tx.product.update({ where: { id: li.productId }, data: { quantity: { increment: li.quantity } } });
      }
    }
    await tx.purchaseBill.update({ where: { id: bill.id }, data: { status: "PENDING", receivedAt: new Date() } });
  });

  revalidatePath("/bills");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  return null;
}

export async function markBillPaidAction(billId: string): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const bill = await prisma.purchaseBill.findFirst({ where: { id: billId, storeId: session.storeId } });
  if (!bill) return { error: "ไม่พบบิลนี้" };
  if (bill.status === "ORDERED") return { error: "ต้องรับสินค้าก่อนจึงจะชำระเงินได้" };

  await prisma.purchaseBill.update({ where: { id: bill.id }, data: { status: "PAID" } });

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return null;
}
