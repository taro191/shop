export type StatusMeta = { text: string; className: string };

export function productStockStatus(qty: number): StatusMeta {
  if (qty === 0) return { text: "สินค้าหมด", className: "bg-danger-light text-danger" };
  if (qty <= 8) return { text: "ใกล้หมด", className: "bg-accent-light text-accent-dark" };
  return { text: "พร้อมขาย", className: "bg-brand-light text-brand" };
}

export function billStatusMeta(status: "PENDING" | "PAID" | "OVERDUE"): StatusMeta {
  switch (status) {
    case "PAID":
      return { text: "ชำระแล้ว", className: "bg-brand-light text-brand" };
    case "OVERDUE":
      return { text: "เกินกำหนด", className: "bg-danger-light text-danger" };
    default:
      return { text: "รอชำระ", className: "bg-accent-light text-accent-dark" };
  }
}
