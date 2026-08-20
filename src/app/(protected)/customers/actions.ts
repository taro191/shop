"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อลูกค้า"),
  phone: z.string().trim().min(9, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง"),
});

export type AddCustomerInput = z.infer<typeof schema>;
export type AddCustomerResult =
  | { ok: true; customer: { id: string; name: string; phone: string; points: number } }
  | { ok: false; error: string };

export async function addCustomer(input: AddCustomerInput): Promise<AddCustomerResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const phone = parsed.data.phone.replace(/[^0-9]/g, "");
  const existing = await prisma.customer.findUnique({ where: { storeId_phone: { storeId: session.storeId, phone } } });
  if (existing) return { ok: false, error: "มีลูกค้าเบอร์นี้อยู่แล้ว" };

  const customer = await prisma.customer.create({
    data: { storeId: session.storeId, name: parsed.data.name, phone },
  });

  revalidatePath("/customers");
  revalidatePath("/sell");
  return { ok: true, customer: { id: customer.id, name: customer.name, phone: customer.phone, points: customer.points } };
}
