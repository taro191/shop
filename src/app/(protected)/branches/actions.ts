"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnerSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { planLimits } from "@/lib/plan";

export type ActionState = { error?: string } | null;

const schema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อสาขา"),
  address: z.string().trim().optional(),
});

export async function addBranchAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { session, user } = await requireOwnerSession();
  if (!session || !user) return { error: "เฉพาะเจ้าของร้านเท่านั้นที่จัดการสาขาได้" };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const [store, branchCount] = await Promise.all([
    prisma.store.findUnique({ where: { id: session.storeId } }),
    prisma.branch.count({ where: { storeId: session.storeId } }),
  ]);
  const limit = planLimits(store?.plan ?? "trial").branches;
  if (branchCount >= limit) {
    return { error: `แพ็กเกจปัจจุบันเปิดได้สูงสุด ${limit} สาขา อัปเกรดแพ็กเกจเพื่อเพิ่มสาขา` };
  }

  const branch = await prisma.branch.create({
    data: { storeId: session.storeId, name: parsed.data.name, address: parsed.data.address || null },
  });

  await logAudit({
    storeId: session.storeId,
    userId: user.id,
    userName: user.name,
    action: "branch.create",
    entityType: "Branch",
    entityId: branch.id,
    summary: `เปิดสาขาใหม่ "${branch.name}"`,
  });

  revalidatePath("/branches");
  revalidatePath("/sell");
  revalidatePath("/reports");
  return null;
}

export async function removeBranchAction(branchId: string): Promise<ActionState> {
  const { session, user } = await requireOwnerSession();
  if (!session || !user) return { error: "เฉพาะเจ้าของร้านเท่านั้นที่จัดการสาขาได้" };

  const branch = await prisma.branch.findFirst({ where: { id: branchId, storeId: session.storeId } });
  if (!branch) return { error: "ไม่พบสาขานี้" };
  if (branch.isMain) return { error: "ลบสาขาหลักไม่ได้" };

  const staffCount = await prisma.user.count({ where: { branchId } });
  if (staffCount > 0) return { error: "ยังมีพนักงานประจำสาขานี้อยู่ ย้ายพนักงานออกก่อนจึงจะลบได้" };

  await prisma.branch.delete({ where: { id: branchId } });

  await logAudit({
    storeId: session.storeId,
    userId: user.id,
    userName: user.name,
    action: "branch.remove",
    entityType: "Branch",
    entityId: branchId,
    summary: `ปิดสาขา "${branch.name}"`,
  });

  revalidatePath("/branches");
  revalidatePath("/sell");
  revalidatePath("/reports");
  return null;
}
