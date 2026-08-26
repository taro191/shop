import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { WriteOffForm } from "@/components/writeoff/WriteOffForm";
import { formatThaiDate, formatThaiTime } from "@/lib/format";

export default async function WriteOffPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [products, recentWriteOffs] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: user.storeId, quantity: { gt: 0 } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, quantity: true },
    }),
    prisma.stockAdjustment.findMany({
      where: {
        storeId: user.storeId,
        OR: [{ reason: { startsWith: "หมดอายุ" } }, { reason: { startsWith: "ชำรุด" } }, { reason: { startsWith: "อื่นๆ" } }],
      },
      include: { product: { select: { name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="mx-auto max-w-[560px] pb-10">
      <PageHeader title="สินค้าหมดอายุ / ชำรุด" subtitle="เลือกสินค้า ระบุเหตุผลและจำนวนที่ต้องตัดออก ระบบจะปรับสต๊อกให้อัตโนมัติ" />
      <div className="px-5 pt-4 sm:px-8">
        <WriteOffForm products={products} />
      </div>

      {recentWriteOffs.length > 0 && (
        <div className="mx-5 mt-8 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
          <div className="border-b border-border px-5 py-4 font-display text-[15px] font-semibold text-foreground">ประวัติล่าสุด</div>
          {recentWriteOffs.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 first:border-none">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-foreground">{a.product.name}</div>
                <div className="mt-0.5 text-[11.5px] text-muted">
                  {formatThaiDate(a.createdAt)} · {formatThaiTime(a.createdAt)}
                  {a.reason ? ` · ${a.reason}` : ""}
                </div>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-danger">
                -{a.before - a.after} {a.product.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
