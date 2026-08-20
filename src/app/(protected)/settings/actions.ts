"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { detectPromptPayTargetKind } from "@/lib/promptpay";

export type ActionState = { error?: string; success?: boolean } | null;

const schema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อร้านค้า"),
  promptPayId: z.string().trim().optional(),
});

export async function updateStoreSettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    promptPayId: formData.get("promptPayId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const rawPromptPay = parsed.data.promptPayId?.trim();
  let promptPayId: string | null = null;
  if (rawPromptPay) {
    if (!detectPromptPayTargetKind(rawPromptPay)) {
      return { error: "เบอร์พร้อมเพย์ต้องเป็นเบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก" };
    }
    promptPayId = rawPromptPay.replace(/[^0-9]/g, "");
  }

  await prisma.store.update({
    where: { id: session.storeId },
    data: { name: parsed.data.name, promptPayId },
  });

  revalidatePath("/settings");
  revalidatePath("/sell");
  revalidatePath("/more");
  return { success: true };
}
