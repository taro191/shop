import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { SearchBox } from "@/components/ui/SearchBox";
import { CatalogAddButton } from "@/components/catalog/CatalogAddButton";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const PAGE_SIZE = 40;

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category : "ทั้งหมด";
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    ...(category !== "ทั้งหมด" ? { category } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { brand: { contains: q } }, { barcode: q }] } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.catalogProduct.count({ where }),
    prisma.catalogProduct.findMany({
      where,
      orderBy: [{ popularity: "desc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  // Mark rows the store already stocks (same barcode, or same name for barcode-less items).
  const owned = await prisma.product.findMany({
    where: {
      storeId: user.storeId,
      OR: [
        { barcode: { in: items.flatMap((i) => (i.barcode ? [i.barcode] : [])) } },
        { name: { in: items.map((i) => i.name) } },
      ],
    },
    select: { barcode: true, name: true },
  });
  const ownedBarcodes = new Set(owned.map((p) => p.barcode));
  const ownedNames = new Set(owned.map((p) => p.name));

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category !== "ทั้งหมด") sp.set("category", category);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `/catalog?${qs}` : "/catalog";
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="คลังสินค้ากลาง"
        subtitle={`ฐานข้อมูลสินค้าร้านขายของชำ ${total.toLocaleString()} รายการ · เลือกแล้วใส่ราคาของร้านเพื่อเพิ่มเข้าคลังสินค้าได้ทันที`}
      />

      <div className="flex flex-col gap-3 px-5 pt-5 sm:px-8">
        <SearchBox
          action="/catalog"
          placeholder="ค้นหาชื่อ ยี่ห้อ หรือบาร์โค้ด..."
          defaultValue={q}
          hiddenParams={{ category: category !== "ทั้งหมด" ? category : undefined }}
        />
        <FilterChips basePath="/catalog" paramName="category" options={["ทั้งหมด", ...PRODUCT_CATEGORIES]} current={category} otherParams={{ q }} />
      </div>

      <div className="mx-5 mt-5 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
        <div className="hidden grid-cols-[2.2fr_1.1fr_0.6fr_1.1fr_1.6fr] gap-3 border-b border-border px-6 py-3 text-[11.5px] text-muted sm:grid">
          <span>สินค้า</span>
          <span>หมวดหมู่</span>
          <span>หน่วย</span>
          <span>บาร์โค้ด</span>
          <span />
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-14 text-center text-[13px] text-muted">ไม่พบสินค้าในคลังสินค้ากลาง</div>
        ) : (
          items.map((item) => {
            const isOwned = (item.barcode && ownedBarcodes.has(item.barcode)) || ownedNames.has(item.name);
            return (
              <div
                key={item.id}
                className="flex flex-col gap-1.5 border-t border-border px-6 py-3.5 first:border-none sm:grid sm:grid-cols-[2.2fr_1.1fr_0.6fr_1.1fr_1.6fr] sm:items-center sm:gap-3"
              >
                <div>
                  <div className="text-[13.5px] font-medium text-foreground">{item.name}</div>
                  {item.brand && <div className="text-[11.5px] text-muted">{item.brand}</div>}
                </div>
                <span className="text-[12.5px] text-muted">{item.category}</span>
                <span className="text-[12.5px] text-foreground/80">{item.unit}</span>
                <span className="font-mono text-[12px] text-muted">{item.barcode ?? "—"}</span>
                <div className="sm:justify-self-end">
                  {isOwned ? (
                    <span className="rounded-md bg-background px-2.5 py-1 text-[11.5px] font-semibold text-muted">มีในร้านแล้ว</span>
                  ) : (
                    <CatalogAddButton catalogId={item.id} unit={item.unit} />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {pageCount > 1 && (
        <div className="mx-5 mt-4 flex items-center justify-between text-[12.5px] text-muted sm:mx-8">
          <span>
            หน้า {page} / {pageCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-[9px] border border-border bg-white px-3.5 py-1.5 font-semibold text-foreground/70">
                ก่อนหน้า
              </Link>
            )}
            {page < pageCount && (
              <Link href={pageHref(page + 1)} className="rounded-[9px] border border-border bg-white px-3.5 py-1.5 font-semibold text-foreground/70">
                ถัดไป
              </Link>
            )}
          </div>
        </div>
      )}

      <p className="mx-5 mt-6 text-[11.5px] leading-relaxed text-muted sm:mx-8">
        ข้อมูลสินค้าที่มีบาร์โค้ดมาจาก{" "}
        <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline">
          Open Food Facts
        </a>{" "}
        และ{" "}
        <a href="https://world.openpetfoodfacts.org" target="_blank" rel="noreferrer" className="underline">
          Open Pet Food Facts
        </a>{" "}
        (สัญญาอนุญาต ODbL) ซึ่งผู้ใช้ทั่วไปร่วมกันบันทึก ชื่อหรือขนาดอาจคลาดเคลื่อนได้ — ตรวจสอบกับสินค้าจริงก่อนเพิ่มเข้าร้าน
      </p>
    </div>
  );
}
