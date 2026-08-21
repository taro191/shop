"use server";

import { getSession, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLowStockProducts, getExpiringProducts } from "@/lib/queries";
import { logAudit } from "@/lib/audit";

export type NotifyResult = { error?: string; success?: boolean };

/** Sends the current low-stock / near-expiry snapshot to the store's configured
 * webhook URL. There's no LINE/email provider wired into this app — the owner
 * points this at their own Discord/Slack/automation endpoint in Settings. */
export async function sendLowStockAlert(): Promise<NotifyResult> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const store = await prisma.store.findUnique({ where: { id: session.storeId } });
  if (!store?.notifyWebhookUrl) {
    return { error: "ยังไม่ได้ตั้งค่า Webhook แจ้งเตือน — ไปที่หน้าข้อมูลร้านค้าเพื่อตั้งค่า" };
  }

  const [lowStock, expiring] = await Promise.all([
    getLowStockProducts(session.storeId, 20),
    getExpiringProducts(session.storeId, 20),
  ]);

  const payload = {
    store: store.name,
    sentAt: new Date().toISOString(),
    lowStock: lowStock.map((p) => ({ name: p.name, quantity: p.quantity, unit: p.unit })),
    expiringSoon: expiring.map((p) => ({ name: p.name, expiresAt: p.expiresAt })),
  };

  try {
    const res = await fetch(store.notifyWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { error: `ปลายทางตอบกลับผิดพลาด (HTTP ${res.status})` };
  } catch {
    return { error: "ส่งแจ้งเตือนไม่สำเร็จ — ตรวจสอบ URL ปลายทางอีกครั้ง" };
  }

  const user = await getCurrentUser();
  await logAudit({
    storeId: session.storeId,
    userId: session.userId,
    userName: user?.name ?? "ไม่ทราบชื่อ",
    action: "notify.low_stock",
    summary: `ส่งแจ้งเตือนสต๊อกต่ำ/ใกล้หมดอายุ (${lowStock.length + expiring.length} รายการ) ผ่าน webhook`,
  });

  return { success: true };
}
