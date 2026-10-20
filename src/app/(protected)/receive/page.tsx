import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReceiveForm } from "@/components/receive/ReceiveForm";
import { BillRowActions } from "@/components/bills/BillRowActions";
import { formatBaht, formatThaiDate } from "@/lib/format";

/** Receiving goods: confirm purchase orders that have arrived, or scan goods straight
 * into stock (recorded as an already-received purchase bill). */
export default async function ReceivePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [orders, products, suppliers] = await Promise.all([
    prisma.purchaseBill.findMany({
      where: { storeId: user.storeId, status: "ORDERED" },
      include: { supplier: true, lineItems: true },
      orderBy: { billDate: "asc" },
    }),
    prisma.product.findMany({
      where: { storeId: user.storeId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        unit: true,
        barcode: true,
        costPrice: true,
        quantity: true,
        packs: { select: { id: true, name: true, size: true, barcode: true }, orderBy: { size: "desc" } },
      },
    }),
    prisma.supplier.findMany({ where: { storeId: user.storeId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-[560px] pb-10">
      <PageHeader title="รับสินค้า" subtitle="สแกนสินค้าที่ส่งมาถึงร้าน ระบบจะเพิ่มสต๊อกและบันทึกเป็นบิลซื้อให้" />

      {orders.length > 0 && (
        <div className="mx-5 mt-4 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
          <div className="border-b border-border px-4 py-3 font-display text-[14.5px] font-semibold text-foreground">
            ใบสั่งซื้อที่รอรับของ ({orders.length})
          </div>
          {orders.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 first:border-none">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-foreground">
                  {b.supplier.name} · {b.billNo}
                </div>
                <div className="truncate text-[11.5px] text-muted">
                  {formatThaiDate(b.billDate)} · {b.lineItems.length} รายการ · ฿{formatBaht(b.amount)}
                </div>
              </div>
              <BillRowActions billId={b.id} status={b.status} />
            </div>
          ))}
        </div>
      )}

      <div className="px-5 pt-4 sm:px-8">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center text-[13px] text-muted">
            ยังไม่มีสินค้าในร้าน เพิ่มสินค้าจากคลังสินค้ากลางหรือหน้าคลังสินค้าก่อน
          </div>
        ) : (
          <ReceiveForm products={products} suppliers={suppliers} />
        )}
      </div>
    </div>
  );
}
