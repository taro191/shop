"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnerSession, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { planLimits } from "@/lib/plan";

export type ActionState = { error?: string } | null;

const addSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อพนักงาน"),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{8,9}$/, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  role: z.enum(["OWNER", "STAFF"]),
  branchId: z.string().trim().optional(),
});

export async function addStaffAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { session, user } = await requireOwnerSession();
  if (!session || !user) return { error: "เฉพาะเจ้าของร้านเท่านั้นที่จัดการพนักงานได้" };

  const parsed = addSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role") || "STAFF",
    branchId: formData.get("branchId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const [store, staffCount, existingPhone] = await Promise.all([
    prisma.store.findUnique({ where: { id: session.storeId } }),
    prisma.user.count({ where: { storeId: session.storeId, active: true } }),
    prisma.user.findUnique({ where: { phone: parsed.data.phone } }),
  ]);
  if (existingPhone) return { error: "เบอร์โทรศัพท์นี้มีการใช้งานแล้ว" };

  const limit = planLimits(store?.plan ?? "trial").staff;
  if (staffCount >= limit) {
    return { error: `แพ็กเกจปัจจุบันเพิ่มพนักงานได้สูงสุด ${limit} คน อัปเกรดแพ็กเกจเพื่อเพิ่มพนักงาน` };
  }

  let branchId: string | null = null;
  if (parsed.data.branchId) {
    const branch = await prisma.branch.findFirst({ where: { id: parsed.data.branchId, storeId: session.storeId } });
    if (!branch) return { error: "ไม่พบสาขาที่เลือก" };
    branchId = branch.id;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const staff = await prisma.user.create({
    data: {
      storeId: session.storeId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      passwordHash,
      role: parsed.data.role,
      branchId,
    },
  });

  await logAudit({
    storeId: session.storeId,
    userId: user.id,
    userName: user.name,
    action: "staff.add",
    entityType: "User",
    entityId: staff.id,
    summary: `เพิ่มพนักงาน "${staff.name}" (${parsed.data.role === "OWNER" ? "เจ้าของร้าน" : "พนักงาน"})`,
  });

  revalidatePath("/staff");
  return null;
}

export async function setStaffActiveAction(userId: string, active: boolean): Promise<ActionState> {
  const { session, user } = await requireOwnerSession();
  if (!session || !user) return { error: "เฉพาะเจ้าของร้านเท่านั้นที่จัดการพนักงานได้" };

  const target = await prisma.user.findFirst({ where: { id: userId, storeId: session.storeId } });
  if (!target) return { error: "ไม่พบพนักงานนี้" };
  if (target.id === user.id) return { error: "ปิดการใช้งานบัญชีตัวเองไม่ได้" };

  if (!active && target.role === "OWNER") {
    const activeOwners = await prisma.user.count({ where: { storeId: session.storeId, role: "OWNER", active: true } });
    if (activeOwners <= 1) return { error: "ต้องมีเจ้าของร้านที่ใช้งานอยู่อย่างน้อย 1 คน" };
  }

  if (active) {
    const [store, staffCount] = await Promise.all([
      prisma.store.findUnique({ where: { id: session.storeId } }),
      prisma.user.count({ where: { storeId: session.storeId, active: true } }),
    ]);
    const limit = planLimits(store?.plan ?? "trial").staff;
    if (staffCount >= limit) return { error: `แพ็กเกจปัจจุบันมีพนักงานได้สูงสุด ${limit} คน` };
  }

  await prisma.user.update({ where: { id: userId }, data: { active } });

  await logAudit({
    storeId: session.storeId,
    userId: user.id,
    userName: user.name,
    action: active ? "staff.reactivate" : "staff.deactivate",
    entityType: "User",
    entityId: userId,
    summary: `${active ? "เปิดใช้งาน" : "ปิดใช้งาน"}บัญชีพนักงาน "${target.name}"`,
  });

  revalidatePath("/staff");
  return null;
}
