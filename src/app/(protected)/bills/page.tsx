import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { SearchBox } from "@/components/ui/SearchBox";
import { AddBillPanel } from "@/components/bills/AddBillPanel";
import { BillRowActions } from "@/components/bills/BillRowActions";
import { billStatusMeta } from "@/lib/status";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { ChevronRightIcon } from "@/components/icons";

const STATUS_OPTIONS = [
  { key: "ทั้งหมด", value: undefined },
  { key: "สั่งซื้อแล้ว", value: "ORDERED" },
  { key: "รอชำระ", value: "PENDING" },
  { key: "ชำระแล้ว", value: "PAID" },
  { key: "เกินกำหนด", value: "OVERDUE" },
] as const;

export default async function BillsPage({ searchParams }: PageProps<"/bills">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const statusLabel = typeof params.status === "string" ? params.status : "ทั้งหมด";
  const statusValue = STATUS_OPTIONS.find((s) => s.key === statusLabel)?.value;

  const [bills, suppliers, products, pending] = await Promise.all([
    prisma.purchaseBill.findMany({
      where: {
        storeId: user.storeId,
        ...(statusValue ? { status: statusValue } : {}),
        ...(q
          ? {
              OR: [
                { billNo: { contains: q, mode: "insensitive" } },
                { supplier: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { supplier: true, lineItems: true },
      orderBy: { billDate: "desc" },
    }),
    prisma.supplier.findMany({ where: { storeId: user.storeId }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { storeId: user.storeId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, costPrice: true },
    }),
    prisma.purchaseBill.findMany({ where: { storeId: user.storeId, status: { in: ["PENDING", "OVERDUE"] } } }),
  ]);

  const pendingTotal = pending.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="pb-10">
      <PageHeader
        title="บิลซื้อสินค้า"
        subtitle={`รวมค้างชำระ ฿${formatBaht(pendingTotal)} จาก ${pending.length} บิล`}
        action={<AddBillPanel products={products} suppliers={suppliers} />}
      />

      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <FilterChips
          basePath="/bills"
          paramName="status"
          options={STATUS_OPTIONS.map((s) => s.key)}
          current={statusLabel}
          otherParams={{ q }}
        />
        <SearchBox
          action="/bills"
          placeholder="ค้นหาเลขที่บิล, ซัพพลายเออร์..."
          defaultValue={q}
          hiddenParams={{ status: statusLabel !== "ทั้งหมด" ? statusLabel : undefined }}
        />
      </div>

      <div className="mx-5 mt-5 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
        {bills.length === 0 ? (
          <div className="px-6 py-14 text-center text-[13px] text-muted">ไม่พบบิลที่ค้นหา</div>
        ) : (
          bills.map((bill) => {
            const status = billStatusMeta(bill.status);
            return (
              <details key={bill.id} className="group border-t border-border first:border-none">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-3.5 [&::-webkit-details-marker]:hidden">
                  <div className="grid flex-grow grid-cols-2 items-center gap-2 sm:grid-cols-[130px_1.2fr_110px_1fr_150px]">
                    <span className="text-[13px] font-semibold text-foreground">{bill.billNo}</span>
                    <span className="text-[13px] text-foreground/80">{bill.supplier.name}</span>
                    <span className="hidden text-[12.5px] text-muted sm:inline">{formatThaiDate(bill.billDate)}</span>
                    <span className="text-right text-[13px] font-semibold text-foreground sm:text-left">
                      ฿{formatBaht(bill.amount)}
                    </span>
                    <span className={`w-fit rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${status.className}`}>
                      {status.text}
                    </span>
                  </div>
                  <BillRowActions billId={bill.id} status={bill.status} />
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <div className="bg-background px-6 pb-4">
                  {bill.lineItems.length === 0 ? (
                    <div className="py-3 text-center text-[12.5px] text-muted">ไม่มีรายการสินค้าแนบในบิลนี้</div>
                  ) : (
                    <div className="flex flex-col gap-1 pt-1">
                      {bill.lineItems.map((li) => (
                        <div key={li.id} className="flex justify-between rounded-lg bg-white px-3.5 py-2 text-[12.5px]">
                          <span className="text-foreground/75">
                            {li.name} × {li.qtyLabel}
                          </span>
                          <span className="font-semibold text-foreground">฿{formatBaht(li.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}
