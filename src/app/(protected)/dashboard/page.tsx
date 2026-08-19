import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats, getLowStockProducts, getRecentTransactions, getWeeklySales } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { formatBaht, formatThaiDate, formatThaiTime } from "@/lib/format";
import { IncomeIcon, InventoryIcon, BillsIcon } from "@/components/icons";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const storeId = user.storeId;

  const [stats, lowStock, recent, weekly] = await Promise.all([
    getDashboardStats(storeId),
    getLowStockProducts(storeId, 4),
    getRecentTransactions(storeId, 5),
    getWeeklySales(storeId),
  ]);

  const maxWeekly = Math.max(...weekly.map((w) => w.value), 1);

  return (
    <div className="pb-10">
      <PageHeader title="แดชบอร์ด" subtitle={`ภาพรวมร้านค้าประจำวันที่ ${formatThaiDate(new Date())}`} />

      <div className="grid grid-cols-1 gap-4 px-5 pt-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        <StatTile
          label="ยอดขายวันนี้"
          value={`฿ ${formatBaht(stats.todayTotal)}`}
          hint={`${stats.todayCount} บิลวันนี้`}
          hintClassName="text-brand"
          icon={<IncomeIcon className="h-4 w-4 text-brand" />}
        />
        <StatTile
          label="สินค้าใกล้หมดสต๊อก"
          value={`${stats.lowStockCount} รายการ`}
          hint="ควรสั่งซื้อเพิ่มเร็วๆ นี้"
          hintClassName="text-accent-dark"
          icon={<InventoryIcon className="h-4 w-4 text-accent-dark" />}
          iconBg="bg-accent-light"
        />
        <StatTile
          label="บิลค้างชำระซัพพลายเออร์"
          value={`฿ ${formatBaht(stats.pendingBillsTotal)}`}
          hint={`${stats.pendingBillsCount} บิลค้างชำระ`}
          hintClassName="text-danger"
          icon={<BillsIcon className="h-4 w-4 text-danger" />}
          iconBg="bg-danger-light"
        />
        <StatTile
          label="ยอดขายเฉลี่ยต่อบิล (วันนี้)"
          value={`฿ ${formatBaht(stats.todayCount ? stats.todayTotal / stats.todayCount : 0)}`}
          hint="อ้างอิงจากรายการขายวันนี้"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 pt-5 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-4 font-display text-[15px] font-semibold text-foreground">ยอดขาย 7 วันล่าสุด</div>
          <div className="flex h-[150px] items-end gap-3 px-1">
            {weekly.map((bar) => (
              <div key={bar.label} className="flex flex-grow flex-col items-center gap-2">
                <span className="text-[11px] text-muted">{bar.value > 0 ? formatBaht(bar.value) : ""}</span>
                <div
                  className="w-full max-w-[34px] rounded-t-[6px] rounded-b-[3px] bg-brand"
                  style={{ height: `${Math.max((bar.value / maxWeekly) * 140, 3)}px` }}
                />
                <span className="text-[11.5px] text-muted">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-3.5 font-display text-[15px] font-semibold text-foreground">สินค้าใกล้หมดสต๊อก</div>
          {lowStock.length === 0 && <div className="py-6 text-center text-[13px] text-muted">สต๊อกสินค้าอยู่ในระดับปกติ</div>}
          <div className="flex flex-col">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-border py-2.5 last:border-none">
                <div>
                  <div className="text-[13px] font-medium text-foreground">{p.name}</div>
                  <div className={`text-[11.5px] ${p.quantity === 0 ? "text-danger" : "text-accent-dark"}`}>
                    เหลือ {p.quantity} {p.unit}
                  </div>
                </div>
                <Link href="/inventory" className="text-[11.5px] font-semibold text-accent-dark">
                  สั่งเพิ่ม
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-5 mt-5 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
        <div className="border-b border-border px-5 py-4 font-display text-[15px] font-semibold text-foreground">
          รายการขายล่าสุด
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-muted">ยังไม่มีรายการขาย</div>
        ) : (
          <div className="flex flex-col">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 first:border-none">
                <div className="min-w-0">
                  <div className="truncate text-[13px] text-foreground">{tx.items}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[12px] text-muted">{formatThaiTime(tx.soldAt)}</span>
                    <span
                      className={`w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        tx.method === "CASH" ? "bg-brand-light text-brand" : "bg-accent-light text-accent-dark"
                      }`}
                    >
                      {tx.method === "CASH" ? "เงินสด" : "เงินโอน"}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-[13px] font-semibold text-foreground">฿ {formatBaht(tx.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
