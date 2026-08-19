"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type ActionState = { error?: string } | null;

const schema = z.object({
  amount: z.coerce.number().positive("กรุณากรอกยอดเงินที่มากกว่า 0"),
  method: z.enum(["CASH", "TRANSFER"]),
  date: z.string().optional(),
  items: z.string().trim().optional(),
});

export async function addIncomeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = schema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    date: formData.get("date") || undefined,
    items: formData.get("items") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const now = new Date();
  let soldAt = now;
  if (parsed.data.date) {
    const day = new Date(`${parsed.data.date}T00:00:00`);
    if (!Number.isNaN(day.getTime())) {
      const isToday = day.toDateString() === now.toDateString();
      soldAt = isToday ? now : new Date(`${parsed.data.date}T12:00:00`);
    }
  }

  await prisma.incomeTransaction.create({
    data: {
      storeId: session.storeId,
      items: parsed.data.items?.trim() || "รายการขายด่วน",
      method: parsed.data.method,
      amount: parsed.data.amount,
      soldAt,
    },
  });

  revalidatePath("/income");
  revalidatePath("/dashboard");
  return null;
}
