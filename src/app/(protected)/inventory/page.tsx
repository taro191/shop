import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { SearchBox } from "@/components/ui/SearchBox";
import { SlideOver, Field, SelectField } from "@/components/ui/SlideOver";
import { addProductAction } from "./actions";
import { productStockStatus } from "@/lib/status";
import { formatBaht } from "@/lib/format";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from "@/lib/constants";

export default async function InventoryPage({
  searchParams,
}: PageProps<"/inventory">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "ทั้งหมด";

  const products = await prisma.product.findMany({
    where: {
      storeId: user.storeId,
      ...(category !== "ทั้งหมด" ? { category } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  });

  const lowCount = products.filter((p) => p.quantity <= 8).length;

  return (
    <div className="pb-10">
      <PageHeader
        title="คลังสินค้า"
        subtitle={`ทั้งหมด ${products.length} รายการ · ใกล้หมด/หมด ${lowCount} รายการ`}
        action={
          <SlideOver triggerLabel="เพิ่มสินค้าใหม่" title="เพิ่มสินค้าใหม่" action={addProductAction}>
            <Field label="ชื่อสินค้า" name="name" placeholder="เช่น น้ำปลาตราปลาหมึก 700ml" required />
            <SelectField label="หมวดหมู่" name="category" options={PRODUCT_CATEGORIES} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="ราคาทุน (บาท)" name="costPrice" type="number" placeholder="0" required />
              <Field label="ราคาขาย (บาท)" name="sellPrice" type="number" placeholder="0" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="จำนวนคงเหลือ" name="quantity" type="number" placeholder="0" required />
              <SelectField label="หน่วยนับ" name="unit" options={PRODUCT_UNITS} />
            </div>
            <Field label="บาร์โค้ด (ถ้ามี)" name="barcode" placeholder="สแกนหรือพิมพ์เลขบาร์โค้ด" />
          </SlideOver>
        }
      />

      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <FilterChips basePath="/inventory" paramName="category" options={["ทั้งหมด", ...PRODUCT_CATEGORIES]} current={category} otherParams={{ q }} />
        <SearchBox action="/inventory" placeholder="ค้นหาชื่อสินค้า..." defaultValue={q} hiddenParams={{ category: category !== "ทั้งหมด" ? category : undefined }} />
      </div>

      <div className="mx-5 mt-5 overflow-hidden rounded-2xl border border-border bg-white sm:mx-8">
        <div className="hidden grid-cols-[2fr_1.1fr_0.9fr_1fr_1fr_1fr] gap-3 border-b border-border px-6 py-3 text-[11.5px] text-muted sm:grid">
          <span>สินค้า</span>
          <span>หมวดหมู่</span>
          <span>คงเหลือ</span>
          <span>ราคาทุน</span>
          <span>ราคาขาย</span>
          <span>สถานะ</span>
        </div>

        {products.length === 0 ? (
          <div className="px-6 py-14 text-center text-[13px] text-muted">ไม่พบสินค้า</div>
        ) : (
          products.map((p) => {
            const status = productStockStatus(p.quantity);
            return (
              <div
                key={p.id}
                className="flex flex-col gap-1 border-t border-border px-6 py-3.5 first:border-none sm:grid sm:grid-cols-[2fr_1.1fr_0.9fr_1fr_1fr_1fr] sm:items-center sm:gap-3"
              >
                <span className="text-[13.5px] font-medium text-foreground">{p.name}</span>
                <span className="text-[12.5px] text-muted">{p.category}</span>
                <span className="text-[13px] text-foreground/80">
                  {p.quantity} {p.unit}
                </span>
                <span className="text-[13px] text-muted">฿{formatBaht(p.costPrice)}</span>
                <span className="text-[13px] font-semibold text-foreground">฿{formatBaht(p.sellPrice)}</span>
                <span className={`w-fit rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${status.className}`}>{status.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
