import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { PackManager } from "@/components/inventory/PackManager";
import { productStockStatus, expiryStatus } from "@/lib/status";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { formatStock, sortPacks } from "@/lib/packs";

export default async function ProductPage({ params }: PageProps<"/inventory/[id]">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, storeId: user.storeId },
    include: { packs: { orderBy: { size: "desc" } } },
  });
  if (!product) notFound();

  const status = productStockStatus(product.quantity);
  const expiry = expiryStatus(product.expiresAt);
  const packs = product.packs.map((p) => ({ id: p.id, name: p.name, size: p.size, barcode: p.barcode, sellPrice: p.sellPrice }));
  const hasPacks = sortPacks(packs).length > 0;

  return (
    <div className="mx-auto max-w-[640px] pb-10">
      <div className="px-5 pt-5 sm:px-8">
        <Link href="/inventory" className="text-[12.5px] font-semibold text-brand">
          ← คลังสินค้า
        </Link>
      </div>
      <PageHeader title={product.name} subtitle={[product.category, product.barcode].filter(Boolean).join(" · ")} />

      <div className="mx-5 mt-4 grid grid-cols-2 gap-2.5 sm:mx-8 sm:grid-cols-3">
        <div className="col-span-2 rounded-2xl border border-border bg-white px-4 py-3.5 sm:col-span-1">
          <div className="text-[11.5px] text-muted">คงเหลือ</div>
          <div className="mt-0.5 font-display text-[19px] font-bold text-foreground">
            {formatStock(product.quantity, product.unit, packs)}
          </div>
          {hasPacks && (
            <div className="text-[11.5px] text-muted">
              รวม {product.quantity.toLocaleString("th-TH")} {product.unit}
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>{status.text}</span>
            {expiry && <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${expiry.className}`}>{expiry.text}</span>}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white px-4 py-3.5">
          <div className="text-[11.5px] text-muted">ราคาขาย / {product.unit}</div>
          <div className="mt-0.5 font-display text-[19px] font-bold text-foreground">฿{formatBaht(product.sellPrice)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-white px-4 py-3.5">
          <div className="text-[11.5px] text-muted">ราคาทุน / {product.unit}</div>
          <div className="mt-0.5 font-display text-[19px] font-bold text-foreground">฿{formatBaht(product.costPrice)}</div>
          {product.expiresAt && <div className="text-[11.5px] text-muted">หมดอายุ {formatThaiDate(product.expiresAt)}</div>}
        </div>
      </div>

      <div className="mx-5 mt-5 sm:mx-8">
        <PackManager
          productId={product.id}
          unit={product.unit}
          sellPrice={product.sellPrice}
          costPrice={product.costPrice}
          packs={packs}
        />
      </div>
    </div>
  );
}
