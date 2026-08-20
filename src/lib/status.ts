export type StatusMeta = { text: string; className: string };

export function productStockStatus(qty: number): StatusMeta {
  if (qty === 0) return { text: "สินค้าหมด", className: "bg-danger-light text-danger" };
  if (qty <= 8) return { text: "ใกล้หมด", className: "bg-accent-light text-accent-dark" };
  return { text: "พร้อมขาย", className: "bg-brand-light text-brand" };
}

/** Expiry badge, or null when there's nothing worth flagging (no date set, or
 * more than 14 days away). `daysLeft` can be negative (already expired). */
export function expiryStatus(expiresAt: Date | null, now: Date = new Date()): (StatusMeta & { daysLeft: number }) | null {
  if (!expiresAt) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / msPerDay);
  if (daysLeft < 0) return { text: "หมดอายุแล้ว", className: "bg-danger-light text-danger", daysLeft };
  if (daysLeft <= 3) return { text: `เหลือ ${daysLeft} วัน`, className: "bg-danger-light text-danger", daysLeft };
  if (daysLeft <= 14) return { text: `เหลือ ${daysLeft} วัน`, className: "bg-accent-light text-accent-dark", daysLeft };
  return null;
}

export function billStatusMeta(status: "ORDERED" | "PENDING" | "PAID" | "OVERDUE"): StatusMeta {
  switch (status) {
    case "ORDERED":
      return { text: "สั่งซื้อแล้ว รอรับของ", className: "bg-[oklch(0.94_0.02_255)] text-[oklch(0.5_0.12_255)]" };
    case "PAID":
      return { text: "ชำระแล้ว", className: "bg-brand-light text-brand" };
    case "OVERDUE":
      return { text: "เกินกำหนด", className: "bg-danger-light text-danger" };
    default:
      return { text: "รอชำระ", className: "bg-accent-light text-accent-dark" };
  }
}
