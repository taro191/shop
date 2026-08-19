import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { SearchBox } from "@/components/ui/SearchBox";
import { formatBaht } from "@/lib/format";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

export default async function SuppliersPage({
  searchParams,
}: PageProps<"/suppliers">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "ทั้งหมด";
  const switchOnly = params.switch === "1";

  const [products, supplierCount] = await Promise.all([
    prisma.product.findMany({
      where: {
        storeId: user.storeId,
        ...(category !== "ทั้งหมด" ? { category } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      include: { supplierPrices: { include: { supplier: true } }, preferredSupplier: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.count({ where: { storeId: user.storeId } }),
  ]);

  const enriched = products
    .filter((p) => p.supplierPrices.length > 0)
    .map((p) => {
      const sorted = [...p.supplierPrices].sort((a, b) => a.price - b.price);
      const cheapest = sorted[0];
      const preferredPrice = p.preferredSupplierId
        ? p.supplierPrices.find((sp) => sp.supplierId === p.preferredSupplierId)?.price
        : undefined;
      const savings = preferredPrice !== undefined ? Math.round((preferredPrice - cheapest.price) * 10) / 10 : 0;
      const shouldSwitch = savings > 0.4;
      return { product: p, sorted, cheapest, savings, shouldSwitch };
    })
    .filter((row) => !switchOnly || row.shouldSwitch);

  const switchParams = new URLSearchParams();
  if (category !== "ทั้งหมด") switchParams.set("category", category);
  if (q) switchParams.set("q", q);
  if (!switchOnly) switchParams.set("switch", "1");
  const switchHref = `/suppliers${switchParams.toString() ? `?${switchParams.toString()}` : ""}`;

  return (
    <div className="pb-10">
      <PageHeader
        title="เทียบราคาซัพพลายเออร์"
        subtitle={`เทียบราคาสินค้าจากร้านส่ง ${supplierCount} เจ้า เพื่อหาราคาต้นทุนที่ดีที่สุด`}
        action={
          <Link
            href={switchHref}
            prefetch={false}
            className={`flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-[12.5px] font-semibold ${
              switchOnly ? "border-brand bg-brand-light text-brand" : "border-border bg-white text-foreground/70"
            }`}
          >
            แสดงเฉพาะที่ควรเปลี่ยนร้านส่ง
          </Link>
        }
      />

      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <FilterChips
          basePath="/suppliers"
          paramName="category"
          options={["ทั้งหมด", ...PRODUCT_CATEGORIES]}
          current={category}
          otherParams={{ q, switch: switchOnly ? "1" : undefined }}
        />
        <SearchBox
          action="/suppliers"
          placeholder="ค้นหาสินค้า..."
          defaultValue={q}
          hiddenParams={{ category: category !== "ทั้งหมด" ? category : undefined, switch: switchOnly ? "1" : undefined }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 pt-5 sm:grid-cols-2 sm:px-8">
        {enriched.length === 0 && (
          <div className="col-span-full py-14 text-center text-[13px] text-muted">ไม่พบสินค้าที่มีข้อมูลราคาซัพพลายเออร์</div>
        )}
        {enriched.map(({ product, sorted, cheapest, savings, shouldSwitch }) => (
          <div key={product.id} className="flex flex-col gap-3.5 rounded-2xl border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-2.5">
              <div>
                <div className="text-[14.5px] font-semibold text-foreground">{product.name}</div>
                <div className="mt-0.5 text-[11.5px] text-muted">
                  หน่วยละ{product.unit} · {product.category}
                </div>
              </div>
              {shouldSwitch && (
                <span className="w-fit shrink-0 rounded-md bg-accent-light px-2.5 py-1 text-[11px] font-semibold text-accent-dark">
                  ประหยัดได้ ฿{savings}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {sorted.map((sp) => {
                const isCheapest = sp.id === cheapest.id;
                const isPreferred = sp.supplierId === product.preferredSupplierId;
                return (
                  <div
                    key={sp.id}
                    className={`flex items-center justify-between rounded-[9px] border px-3 py-2.5 ${
                      isCheapest ? "border-brand/40 bg-brand-light" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-medium text-foreground/85">{sp.supplier.name}</span>
                      {isPreferred && (
                        <span className="rounded-md bg-background px-1.5 py-0.5 text-[10.5px] text-muted">ใช้อยู่</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isCheapest && (
                        <span className="rounded-md bg-brand-light px-1.5 py-0.5 text-[10.5px] font-semibold text-brand">
                          ถูกสุด
                        </span>
                      )}
                      <span className={`text-[13.5px] font-bold ${isCheapest ? "text-brand" : "text-foreground/85"}`}>
                        ฿{formatBaht(sp.price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
