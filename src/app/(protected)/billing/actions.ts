"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnerSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { planLimits, PLAN_INFO, type PlanId } from "@/lib/plan";

export type ActionState = { error?: string; success?: boolean } | null;

const schema = z.object({ plan: z.enum(["trial", "starter", "standard", "premium"]) });

/** No real payment gateway is wired into this app — changing plan here just
 * updates the stored tier directly. It's still meaningful because staff/branch
 * limits are enforced against it; there's no simulated charge or invoice. */
export async function changePlanAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { session, user } = await requireOwnerSession();
  if (!session || !user) return { error: "เฉพาะเจ้าของร้านเท่านั้นที่เปลี่ยนแพ็กเกจได้" };

  const parsed = schema.safeParse({ plan: formData.get("plan") });
  if (!parsed.success) return { error: "แพ็กเกจไม่ถูกต้อง" };

  const nextPlan: PlanId = parsed.data.plan;
  const nextLimits = planLimits(nextPlan);

  const [activeStaff, branchCount] = await Promise.all([
    prisma.user.count({ where: { storeId: session.storeId, active: true } }),
    prisma.branch.count({ where: { storeId: session.storeId } }),
  ]);
  if (activeStaff > nextLimits.staff) {
    return { error: `แพ็กเกจนี้รองรับพนักงานได้สูงสุด ${nextLimits.staff} คน แต่ตอนนี้มี ${activeStaff} คน กรุณาปิดใช้งานบางบัญชีก่อน` };
  }
  if (branchCount > nextLimits.branches) {
    return { error: `แพ็กเกจนี้รองรับได้สูงสุด ${nextLimits.branches} สาขา แต่ตอนนี้มี ${branchCount} สาขา กรุณาปิดสาขาก่อน` };
  }

  const store = await prisma.store.findUnique({ where: { id: session.storeId } });
  await prisma.store.update({ where: { id: session.storeId }, data: { plan: nextPlan } });

  await logAudit({
    storeId: session.storeId,
    userId: user.id,
    userName: user.name,
    action: "billing.plan_change",
    summary: `เปลี่ยนแพ็กเกจจาก "${PLAN_INFO[(store?.plan as PlanId) ?? "trial"].label}" เป็น "${PLAN_INFO[nextPlan].label}" (โหมดทดสอบ ยังไม่เชื่อมระบบชำระเงินจริง)`,
  });

  revalidatePath("/billing");
  revalidatePath("/staff");
  revalidatePath("/branches");
  return { success: true };
}
