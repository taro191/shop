import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StockTakeForm } from "@/components/StockTakeForm";
import { formatThaiDate, formatThaiTime } from "@/lib/format";

export default async function StockTakePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [products, recentAdjustments] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: user.storeId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, category: true, quantity: true },
    }),
    prisma.stockAdjustment.findMany({
      where: { storeId: user.storeId },
      include: { product: { select: { name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="pb-10">
      <PageHeader title="ตรวจนับสต๊อก" subtitle="กรอกจำนวนที่นับได้จริง ระบบจะปรับสต๊อกและบันทึกส่วนต่างให้อัตโนมัติ" />
      <div className="px-5 pt-5 sm:px-8">
        <StockTakeForm products={products} />
      </div>

      {recentAdjustments.length > 0 && (
        <div className="mx-5 mt-8 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
          <div className="border-b border-border px-5 py-4 font-display text-[15px] font-semibold text-foreground">ประวัติการปรับปรุงล่าสุด</div>
          {recentAdjustments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 first:border-none">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-foreground">{a.product.name}</div>
                <div className="mt-0.5 text-[11.5px] text-muted">
                  {formatThaiDate(a.createdAt)} · {formatThaiTime(a.createdAt)}
                  {a.reason ? ` · ${a.reason}` : ""}
                </div>
              </div>
              <div className="shrink-0 text-right text-[13px]">
                <span className="text-muted">
                  {a.before} → {a.after} {a.product.unit}
                </span>
                <span className={`ml-2 font-semibold ${a.after > a.before ? "text-brand" : a.after < a.before ? "text-danger" : "text-muted"}`}>
                  ({a.after - a.before > 0 ? "+" : ""}
                  {a.after - a.before})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
