import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { FilterChips } from "@/components/ui/FilterChips";
import { SlideOver, Field } from "@/components/ui/SlideOver";
import { addIncomeAction } from "./actions";
import { formatBaht, formatThaiTime } from "@/lib/format";
import { startOfDay, endOfDay, addDays, dateKey } from "@/lib/date";

function labelForDate(key: string) {
  const today = dateKey(new Date());
  const yesterday = dateKey(addDays(new Date(), -1));
  if (key === today) return "วันนี้";
  if (key === yesterday) return "เมื่อวาน";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(new Date(`${key}T00:00:00`));
}

export default async function IncomePage({ searchParams }: PageProps<"/income">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const today = new Date();
  const dateOptions = [dateKey(today), dateKey(addDays(today, -1)), dateKey(addDays(today, -7))];
  const selectedDate = typeof params.date === "string" && dateOptions.includes(params.date) ? params.date : dateOptions[0];
  const dayStart = startOfDay(new Date(`${selectedDate}T00:00:00`));
  const dayEnd = endOfDay(new Date(`${selectedDate}T00:00:00`));

  const transactions = await prisma.incomeTransaction.findMany({
    where: { storeId: user.storeId, soldAt: { gte: dayStart, lte: dayEnd } },
    orderBy: { soldAt: "desc" },
  });

  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const cash = transactions.filter((t) => t.method === "CASH").reduce((s, t) => s + t.amount, 0);
  const transfer = total - cash;
  const cashPct = total > 0 ? Math.round((cash / total) * 100) : 0;
  const transferPct = 100 - cashPct;

  return (
    <div className="pb-10">
      <PageHeader
        title="รายรับรายวัน"
        subtitle="สรุปยอดขายและช่องทางการชำระเงินของร้าน"
        action={
          <SlideOver triggerLabel="บันทึกยอดขาย" title="บันทึกยอดขายด่วน" action={addIncomeAction}>
            <input type="hidden" name="date" value={selectedDate} />
            <Field label="รายการ (ถ้ามี)" name="items" placeholder="เช่น มาม่า x3, น้ำอัดลม x2" />
            <Field label="ยอดเงิน (บาท)" name="amount" type="number" placeholder="0" required />
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-muted">ช่องทางชำระเงิน</label>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="has-checked:border-brand has-checked:bg-brand-light has-checked:text-brand flex cursor-pointer items-center justify-center rounded-[9px] border border-border py-2.5 text-[13px] font-medium text-foreground/70">
                  <input type="radio" name="method" value="CASH" defaultChecked className="sr-only" />
                  เงินสด
                </label>
                <label className="has-checked:border-accent has-checked:bg-accent-light has-checked:text-accent-dark flex cursor-pointer items-center justify-center rounded-[9px] border border-border py-2.5 text-[13px] font-medium text-foreground/70">
                  <input type="radio" name="method" value="TRANSFER" className="sr-only" />
                  เงินโอน / QR
                </label>
              </div>
            </div>
          </SlideOver>
        }
      />

      <div className="px-5 pt-5 sm:px-8">
        <FilterChips
          basePath="/income"
          paramName="date"
          options={dateOptions}
          current={selectedDate}
          otherParams={{}}
          labelFor={labelForDate}
          allValue="__none__"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 pt-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        <StatTile label={`ยอดขายรวม (${labelForDate(selectedDate)})`} value={`฿ ${formatBaht(total)}`} />
        <StatTile label="จำนวนบิล" value={`${transactions.length} บิล`} />
        <StatTile label="เงินสด" value={`฿ ${formatBaht(cash)}`} hint={`${cashPct}%`} hintClassName="text-brand" />
        <StatTile label="เงินโอน / QR" value={`฿ ${formatBaht(transfer)}`} hint={`${transferPct}%`} hintClassName="text-accent-dark" />
      </div>

      <div className="px-5 pt-5 sm:px-8">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-4 font-display text-[15px] font-semibold text-foreground">สัดส่วนช่องทางการชำระเงิน</div>
          <div className="flex flex-col gap-3.5">
            <div>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="text-foreground/80">เงินสด</span>
                <span className="font-semibold text-foreground">฿{formatBaht(cash)} ({cashPct}%)</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-md bg-brand-light">
                <div className="h-full rounded-md bg-brand" style={{ width: `${cashPct}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="text-foreground/80">เงินโอน / QR พร้อมเพย์</span>
                <span className="font-semibold text-foreground">฿{formatBaht(transfer)} ({transferPct}%)</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-md bg-accent-light">
                <div className="h-full rounded-md bg-accent-dark" style={{ width: `${transferPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-5 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
        <div className="border-b border-border px-5 py-4 font-display text-[15px] font-semibold text-foreground">รายการขาย</div>
        {transactions.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted">ยังไม่มีรายการขายวันนี้</div>
        ) : (
          transactions.map((tx) => (
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
          ))
        )}
      </div>
    </div>
  );
}
