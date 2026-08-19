"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type ActionState = { error?: string } | null;

const schema = z.object({
  billNo: z.string().trim().min(1, "กรุณากรอกเลขที่บิล"),
  supplierId: z.string().trim().min(1, "กรุณาเลือกซัพพลายเออร์"),
  amount: z.coerce.number().positive("กรุณากรอกยอดเงินที่มากกว่า 0"),
  status: z.enum(["PENDING", "PAID"]),
});

export async function addBillAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = schema.safeParse({
    billNo: formData.get("billNo"),
    supplierId: formData.get("supplierId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const supplier = await prisma.supplier.findFirst({
    where: { id: parsed.data.supplierId, storeId: session.storeId },
  });
  if (!supplier) return { error: "ไม่พบซัพพลายเออร์ที่เลือก" };

  await prisma.purchaseBill.create({
    data: {
      storeId: session.storeId,
      billNo: parsed.data.billNo,
      supplierId: supplier.id,
      amount: parsed.data.amount,
      status: parsed.data.status,
    },
  });

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return null;
}
