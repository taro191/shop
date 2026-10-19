import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { SearchBox } from "@/components/ui/SearchBox";
import { CatalogFallback } from "@/components/catalog/CatalogFallback";
import { productStockStatus, expiryStatus } from "@/lib/status";
import { formatBaht } from "@/lib/format";
import { addDays } from "@/lib/date";

const VIEWS = ["ใกล้หมด", "ใกล้หมดอายุ", "ทั้งหมด"];

/** Mobile stock check: what's running out or expiring, plus a name/barcode lookup
 * across the whole store. Low stock = 8 or fewer, matching productStockStatus. */
export default async function StockPage({ searchParams }: PageProps<"/stock">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const view = typeof params.view === "string" && VIEWS.includes(params.view) ? params.view : "ใกล้หมด";
  const storeId = user.storeId;
  const expirySoon = addDays(new Date(), 14);

  const [outCount, lowCount, expiringCount, products] = await Promise.all([
    prisma.product.count({ where: { storeId, quantity: 0 } }),
    prisma.product.count({ where: { storeId, quantity: { gt: 0, lte: 8 } } }),
    prisma.product.count({ where: { storeId, quantity: { gt: 0 }, expiresAt: { lte: expirySoon } } }),
    prisma.product.findMany({
      where: {
        storeId,
        ...(q ? { OR: [{ name: { contains: q } }, { barcode: q }] } : {}),
        ...(view === "ใกล้หมด" ? { quantity: { lte: 8 } } : {}),
        ...(view === "ใกล้หมดอายุ" ? { quantity: { gt: 0 }, expiresAt: { lte: expirySoon } } : {}),
      },
      orderBy: view === "ใกล้หมดอายุ" ? { expiresAt: "asc" } : view === "ใกล้หมด" ? { quantity: "asc" } : { name: "asc" },
      take: 200,
    }),
  ]);

  return (
    <div className="mx-auto max-w-[560px] pb-10">
      <PageHeader title="เช็คสต๊อก" subtitle="ดูสินค้าใกล้หมดและใกล้หมดอายุ หรือค้นหาจำนวนคงเหลือ" />

      <div className="grid grid-cols-3 gap-2 px-5 pt-4 sm:px-8">
        <SummaryCard label="หมดแล้ว" value={outCount} className="text-danger" />
        <SummaryCard label="ใกล้หมด" value={lowCount} className="text-accent-dark" />
        <SummaryCard label="ใกล้หมดอายุ" value={expiringCount} className="text-accent-dark" />
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4 sm:px-8">
        <SearchBox action="/stock" placeholder="ชื่อสินค้าหรือเลขบาร์โค้ด..." defaultValue={q} scan hiddenParams={{ view: view !== "ใกล้หมด" ? view : undefined }} />
        <FilterChips basePath="/stock" paramName="view" options={VIEWS} current={view} allValue="ใกล้หมด" otherParams={{ q }} />
      </div>

      <div className="mx-5 mt-4 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
        {products.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-muted">
            {q ? `ไม่พบสินค้า "${q}" ในร้าน` : view === "ทั้งหมด" ? "ยังไม่มีสินค้าในร้าน" : "ไม่มีสินค้าในกลุ่มนี้"}
          </div>
        ) : (
          products.map((p) => {
            const stock = productStockStatus(p.quantity);
            const expiry = expiryStatus(p.expiresAt);
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 first:border-none">
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-medium text-foreground">{p.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
                    <span>
                      {p.category} · ฿{formatBaht(p.sellPrice)}
                    </span>
                    {expiry && <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${expiry.className}`}>{expiry.text}</span>}
                  </div>
                </div>
                <span className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-semibold ${stock.className}`}>
                  {p.quantity} {p.unit}
                </span>
              </div>
            );
          })
        )}
      </div>

      {q && products.length === 0 && (
        <div className="px-5 pt-3 sm:px-8">
          <CatalogFallback q={q} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 px-5 pt-4 sm:px-8">
        <Link href="/receive" className="rounded-[11px] bg-brand py-3 text-center text-[13px] font-semibold text-white">
          รับสินค้าเข้าสต๊อก
        </Link>
        <Link href="/stock-take" className="rounded-[11px] border border-border bg-white py-3 text-center text-[13px] font-semibold text-foreground/75">
          ตรวจนับสต๊อก
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-white px-3 py-2.5 text-center">
      <div className={`font-display text-[20px] font-bold ${className}`}>{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
