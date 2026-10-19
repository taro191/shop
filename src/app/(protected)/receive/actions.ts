"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createBill, type CreateBillInput, type CreateBillResult } from "@/app/(protected)/bills/actions";

/** Name of the placeholder supplier used when goods are received without picking one. */
const UNSPECIFIED_SUPPLIER = "ไม่ระบุซัพพลายเออร์";

export type QuickReceiveInput = {
  supplierId: string | null;
  billNo: string;
  lineItems: CreateBillInput["lineItems"];
};

/** Mobile "รับสินค้า": records scanned goods as an already-received purchase bill so
 * stock goes up and the cost stays traceable in /bills. Supplier and bill number are
 * optional on the phone — a placeholder supplier and a timestamped number fill in. */
export async function quickReceiveAction(input: QuickReceiveInput): Promise<CreateBillResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  let supplierId = input.supplierId;
  if (!supplierId) {
    const existing = await prisma.supplier.findFirst({ where: { storeId: session.storeId, name: UNSPECIFIED_SUPPLIER } });
    supplierId = (existing ?? (await prisma.supplier.create({ data: { storeId: session.storeId, name: UNSPECIFIED_SUPPLIER } }))).id;
  }

  const billNo = input.billNo.trim() || `รับของ-${bangkokStamp(new Date())}`;
  return createBill({ billNo, supplierId, receivedNow: true, lineItems: input.lineItems });
}

/** "YYMMDD-HHmm" in Thai time, for auto-generated bill numbers. */
function bangkokStamp(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}`;
}
