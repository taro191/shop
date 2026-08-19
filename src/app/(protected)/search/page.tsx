import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LiveSearchBox } from "@/components/LiveSearchBox";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { productStockStatus } from "@/lib/status";
import { formatBaht } from "@/lib/format";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const mode = params.mode === "scan" ? "scan" : "type";
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const products = q
    ? await prisma.product.findMany({
        where: { storeId: user.storeId, name: { contains: q, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: 30,
      })
    : [];

  const recent = q
    ? []
    : await prisma.product.findMany({
        where: { storeId: user.storeId },
        orderBy: { updatedAt: "desc" },
        take: 4,
      });

  return (
    <div className="mx-auto max-w-[520px] pb-10">
      <PageHeader title="เช็คราคาสินค้า" subtitle="พิมพ์ชื่อหรือสแกนบาร์โค้ดเพื่อดูราคาล่าสุด" />

      <div className="px-5 pt-4 sm:px-8">
        <div className="flex rounded-[11px] bg-[oklch(0.94_0.004_90)] p-[3px]">
          <Link
            href="/search"
            prefetch={false}
            className={`flex-1 rounded-[9px] py-2.5 text-center text-[13px] font-semibold ${
              mode === "type" ? "bg-white text-brand shadow-sm" : "text-muted"
            }`}
          >
            พิมพ์ค้นหา
          </Link>
          <Link
            href="/search?mode=scan"
            prefetch={false}
            className={`flex-1 rounded-[9px] py-2.5 text-center text-[13px] font-semibold ${
              mode === "scan" ? "bg-white text-brand shadow-sm" : "text-muted"
            }`}
          >
            สแกนบาร์โค้ด
          </Link>
        </div>
      </div>

      <div className="px-5 pt-4 sm:px-8">
        {mode === "type" ? (
          <div className="flex flex-col gap-4">
            <Suspense fallback={<div className="h-[46px] rounded-[12px] border border-border bg-white" />}>
              <LiveSearchBox basePath="/search" placeholder="พิมพ์ชื่อสินค้า เช่น น้ำปลา, ข้าวสาร" />
            </Suspense>

            {!q && recent.length > 0 && (
              <div>
                <div className="mb-2.5 text-xs font-semibold text-muted">สินค้าที่อัปเดตล่าสุด</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recent.map((p) => (
                    <Link
                      key={p.id}
                      href={`/search?q=${encodeURIComponent(p.name)}`}
                      prefetch={false}
                      className="flex-shrink-0 whitespace-nowrap rounded-[9px] border border-border bg-white px-3.5 py-2 text-[12.5px] text-foreground/75"
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {products.map((p) => {
                const status = productStockStatus(p.quantity);
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-white px-4 py-3.5">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-foreground">{p.name}</div>
                      <div className="mt-0.5 text-[11.5px] text-muted">
                        {p.category} · หน่วยละ{p.unit}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-lg font-bold text-foreground">฿{formatBaht(p.sellPrice)}</div>
                      <div className={`mt-0.5 rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${status.className}`}>
                        {status.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              {q && products.length === 0 && (
                <div className="py-10 text-center text-[13px] text-muted">ไม่พบสินค้าที่ค้นหา</div>
              )}
            </div>
          </div>
        ) : (
          <BarcodeScanner />
        )}
      </div>
    </div>
  );
}
