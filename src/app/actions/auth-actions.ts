"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type ActionState = { error?: string } | null;

const signupSchema = z.object({
  storeName: z.string().trim().min(1, "กรุณากรอกชื่อร้านค้า"),
  ownerName: z.string().trim().min(1, "กรุณากรอกชื่อเจ้าของร้าน"),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{8,9}$/, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export async function signupAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    storeName: formData.get("storeName"),
    ownerName: formData.get("ownerName"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const { storeName, ownerName, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return { error: "เบอร์โทรศัพท์นี้มีการสมัครใช้งานแล้ว" };
  }

  const passwordHash = await hashPassword(password);
  const store = await prisma.store.create({
    data: {
      name: storeName,
      plan: "trial",
      users: {
        create: { name: ownerName, phone, passwordHash, role: "OWNER" },
      },
    },
    include: { users: true },
  });

  await createSession({ userId: store.users[0].id, storeId: store.id });
  redirect("/dashboard");
}

const loginSchema = z.object({
  phone: z.string().trim().min(1, "กรุณากรอกเบอร์โทรศัพท์"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const { phone, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง" };
  }
  if (!user.active) {
    return { error: "บัญชีนี้ถูกปิดใช้งานแล้ว กรุณาติดต่อเจ้าของร้าน" };
  }

  await createSession({ userId: user.id, storeId: user.storeId });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
