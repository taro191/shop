"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnerSession } from "@/lib/auth";
import { detectPromptPayTargetKind } from "@/lib/promptpay";
import { logAudit } from "@/lib/audit";

export type ActionState = { error?: string; success?: boolean } | null;

const schema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อร้านค้า"),
  promptPayId: z.string().trim().optional(),
  notifyWebhookUrl: z.string().trim().optional(),
});

export async function updateStoreSettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { session, user } = await requireOwnerSession();
  if (!session || !user) return { error: "เฉพาะเจ้าของร้านเท่านั้นที่แก้ไขข้อมูลร้านค้าได้" };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    promptPayId: formData.get("promptPayId") || undefined,
    notifyWebhookUrl: formData.get("notifyWebhookUrl") || undefined,
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

  const rawWebhook = parsed.data.notifyWebhookUrl?.trim();
  if (rawWebhook && !/^https:\/\/.+/.test(rawWebhook)) {
    return { error: "Webhook URL ต้องขึ้นต้นด้วย https://" };
  }

  await prisma.store.update({
    where: { id: session.storeId },
    data: { name: parsed.data.name, promptPayId, notifyWebhookUrl: rawWebhook || null },
  });

  await logAudit({
    storeId: session.storeId,
    userId: user.id,
    userName: user.name,
    action: "settings.update",
    entityType: "Store",
    entityId: session.storeId,
    summary: "แก้ไขข้อมูลร้านค้า",
  });

  revalidatePath("/settings");
  revalidatePath("/sell");
  revalidatePath("/more");
  return { success: true };
}
