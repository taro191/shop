"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export type ActionState = { error?: string } | null;

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().trim().min(1, "กรุณากรอกหมวดหมู่ / รายการ"),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  note: z.string().trim().optional(),
});

export async function addCashEntryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = schema.safeParse({
    type: formData.get("type"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  const entry = await prisma.cashEntry.create({
    data: {
      storeId: session.storeId,
      type: parsed.data.type,
      category: parsed.data.category,
      amount: parsed.data.amount,
      note: parsed.data.note || null,
      branchId: user?.branchId ?? null,
    },
  });

  await logAudit({
    storeId: session.storeId,
    userId: session.userId,
    userName: user?.name ?? "ไม่ทราบชื่อ",
    action: "cashflow.add",
    entityType: "CashEntry",
    entityId: entry.id,
    summary: `บันทึก${parsed.data.type === "INCOME" ? "รายรับ" : "รายจ่าย"} "${parsed.data.category}" ฿${parsed.data.amount.toLocaleString()}`,
  });

  revalidatePath("/cashflow");
  return null;
}
