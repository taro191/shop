import { getCurrentUser } from "@/lib/auth";
import { getReportRows, getAverageMarginRatio, type ReportPeriod } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { FilterChips } from "@/components/ui/FilterChips";
import { formatBaht } from "@/lib/format";

const PERIOD_LABELS: Record<ReportPeriod, { tab: string; col: string }> = {
  daily: { tab: "รายวัน", col: "วันที่" },
  monthly: { tab: "รายเดือน", col: "เดือน" },
  quarterly: { tab: "รายไตรมาส", col: "ไตรมาส" },
};

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const period: ReportPeriod = params.period === "monthly" || params.period === "quarterly" ? params.period : "daily";

  const [rows, marginRatio] = await Promise.all([
    getReportRows(user.storeId, period),
    getAverageMarginRatio(user.storeId),
  ]);

  const withProfit = rows.map((r) => ({ ...r, cost: Math.round(r.sales * (1 - marginRatio)), profit: Math.round(r.sales * marginRatio) }));
  const totalSales = withProfit.reduce((s, r) => s + r.sales, 0);
  const totalCost = withProfit.reduce((s, r) => s + r.cost, 0);
  const totalProfit = totalSales - totalCost;
  const maxSales = Math.max(...withProfit.map((r) => r.sales), 1);

  return (
    <div className="pb-10">
      <PageHeader
        title="รายงานสรุปซื้อขาย"
        subtitle="ภาพรวมยอดขาย ต้นทุน และกำไร แยกตามช่วงเวลา (ต้นทุน/กำไรเป็นค่าประมาณการจากอัตรากำไรเฉลี่ยของสินค้า)"
        action={
          <FilterChips
            basePath="/reports"
            paramName="period"
            options={["daily", "monthly", "quarterly"]}
            current={period}
            labelFor={(o) => PERIOD_LABELS[o as ReportPeriod].tab}
            allValue="__none__"
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 px-5 pt-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        <StatTile label={`ยอดขายรวม (${PERIOD_LABELS[period].tab})`} value={`฿ ${formatBaht(totalSales)}`} />
        <StatTile label="ต้นทุนรวม (ประมาณการ)" value={`฿ ${formatBaht(totalCost)}`} />
        <StatTile label="กำไรสุทธิ (ประมาณการ)" value={`฿ ${formatBaht(totalProfit)}`} />
        <StatTile label="อัตรากำไรเฉลี่ย" value={`${Math.round(marginRatio * 1000) / 10}%`} />
      </div>

      <div className="px-5 pt-5 sm:px-8">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <span className="font-display text-[15px] font-semibold text-foreground">แนวโน้มยอดขายและกำไร</span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-brand" /> ยอดขาย
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-accent-dark" /> กำไร
            </span>
          </div>
          <div className="flex h-[180px] items-end gap-2.5 overflow-x-auto px-1">
            {withProfit.map((r) => (
              <div key={r.label} className="flex flex-shrink-0 flex-col items-center gap-2">
                <div className="flex h-[150px] items-end gap-1">
                  <div className="w-3.5 rounded-t-[5px] rounded-b-[2px] bg-brand" style={{ height: `${Math.max((r.sales / maxSales) * 150, 2)}px` }} />
                  <div className="w-3.5 rounded-t-[5px] rounded-b-[2px] bg-accent-dark" style={{ height: `${Math.max((r.profit / maxSales) * 150, 2)}px` }} />
                </div>
                <span className="whitespace-nowrap text-[11px] text-muted">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-5 mt-5 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
        <div className="border-b border-border px-5 py-4 font-display text-[15px] font-semibold text-foreground">รายละเอียดตามช่วงเวลา</div>
        <div className="hidden grid-cols-[1.3fr_1fr_1fr_1fr_0.8fr] gap-3 px-5 py-2.5 text-[11.5px] text-muted sm:grid">
          <span>{PERIOD_LABELS[period].col}</span>
          <span>ยอดขาย</span>
          <span>ต้นทุน</span>
          <span>กำไร</span>
          <span>จำนวนบิล</span>
        </div>
        {withProfit.map((r) => (
          <div key={r.label} className="flex flex-col gap-1 border-t border-border px-5 py-3 first:border-none sm:grid sm:grid-cols-[1.3fr_1fr_1fr_1fr_0.8fr] sm:items-center sm:gap-3">
            <span className="text-[13px] font-medium text-foreground">{r.label}</span>
            <span className="text-[13px] text-foreground/80">฿{formatBaht(r.sales)}</span>
            <span className="text-[13px] text-muted">฿{formatBaht(r.cost)}</span>
            <span className="text-[13px] font-semibold text-brand">฿{formatBaht(r.profit)}</span>
            <span className="text-[13px] text-muted">{r.bills}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
