import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { FilterChips } from "@/components/ui/FilterChips";
import { SlideOver, Field } from "@/components/ui/SlideOver";
import { addCashEntryAction } from "./actions";
import { formatBaht, formatThaiTime } from "@/lib/format";
import { startOfDay, endOfDay, addDays, dateKey } from "@/lib/date";

function labelForDate(key: string) {
  const today = dateKey(new Date());
  const yesterday = dateKey(addDays(new Date(), -1));
  if (key === today) return "วันนี้";
  if (key === yesterday) return "เมื่อวาน";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(new Date(`${key}T00:00:00`));
}

export default async function CashflowPage({ searchParams }: PageProps<"/cashflow">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const today = new Date();
  const dateOptions = [dateKey(today), dateKey(addDays(today, -1)), dateKey(addDays(today, -7))];
  const selectedDate = typeof params.date === "string" && dateOptions.includes(params.date) ? params.date : dateOptions[0];
  const dayStart = startOfDay(new Date(`${selectedDate}T00:00:00`));
  const dayEnd = endOfDay(new Date(`${selectedDate}T00:00:00`));

  const entries = await prisma.cashEntry.findMany({
    where: { storeId: user.storeId, recordedAt: { gte: dayStart, lte: dayEnd } },
    orderBy: { recordedAt: "desc" },
  });

  const income = entries.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);
  const net = income - expense;

  return (
    <div className="pb-10">
      <PageHeader
        title="รายรับ-รายจ่าย"
        subtitle="บันทึกรายรับและรายจ่ายทั่วไปของร้าน (นอกเหนือจากยอดขายหน้าร้านและบิลซื้อสินค้า)"
        action={
          <SlideOver triggerLabel="บันทึกรายการ" title="บันทึกรายรับ-รายจ่าย" action={addCashEntryAction}>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-muted">ประเภท</label>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="has-checked:border-brand has-checked:bg-brand-light has-checked:text-brand flex cursor-pointer items-center justify-center rounded-[9px] border border-border py-2.5 text-[13px] font-medium text-foreground/70">
                  <input type="radio" name="type" value="INCOME" defaultChecked className="sr-only" />
                  รายรับ
                </label>
                <label className="has-checked:border-danger has-checked:bg-danger-light has-checked:text-danger flex cursor-pointer items-center justify-center rounded-[9px] border border-border py-2.5 text-[13px] font-medium text-foreground/70">
                  <input type="radio" name="type" value="EXPENSE" className="sr-only" />
                  รายจ่าย
                </label>
              </div>
            </div>
            <Field label="หมวดหมู่ / รายการ" name="category" placeholder="เช่น ค่าน้ำ, ค่าไฟ, ค่าเช่า, ค่าแรง, รายรับอื่นๆ" required />
            <Field label="จำนวนเงิน (บาท)" name="amount" type="number" placeholder="0" required />
            <Field label="หมายเหตุ (ถ้ามี)" name="note" placeholder="รายละเอียดเพิ่มเติม" />
          </SlideOver>
        }
      />

      <div className="px-5 pt-5 sm:px-8">
        <FilterChips
          basePath="/cashflow"
          paramName="date"
          options={dateOptions}
          current={selectedDate}
          otherParams={{}}
          labelFor={labelForDate}
          allValue="__none__"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 pt-5 sm:grid-cols-3 sm:px-8">
        <StatTile label={`รายรับ (${labelForDate(selectedDate)})`} value={`฿ ${formatBaht(income)}`} hintClassName="text-brand" />
        <StatTile label="รายจ่าย" value={`฿ ${formatBaht(expense)}`} hintClassName="text-danger" />
        <StatTile label="สุทธิ" value={`฿ ${formatBaht(net)}`} />
      </div>

      <div className="mx-5 mt-5 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
        <div className="border-b border-border px-5 py-4 font-display text-[15px] font-semibold text-foreground">รายการ</div>
        {entries.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted">ยังไม่มีรายการ</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 first:border-none">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-foreground">{e.category}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[12px] text-muted">{formatThaiTime(e.recordedAt)}</span>
                  {e.note && <span className="truncate text-[12px] text-muted">· {e.note}</span>}
                </div>
              </div>
              <span className={`shrink-0 text-[13px] font-semibold ${e.type === "INCOME" ? "text-brand" : "text-danger"}`}>
                {e.type === "INCOME" ? "+" : "-"}฿ {formatBaht(e.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
