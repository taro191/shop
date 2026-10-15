import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LiveSearchBox } from "@/components/LiveSearchBox";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { productStockStatus } from "@/lib/status";
import { formatBaht } from "@/lib/format";
import { WalletIcon, ClipboardCheckIcon, AlertTriangleIcon } from "@/components/icons";

const QUICK_ACTIONS = [
  { href: "/cashflow", label: "รายรับ-รายจ่าย", icon: WalletIcon, iconClass: "text-brand" },
  { href: "/stock-take", label: "ปรับสตอก", icon: ClipboardCheckIcon, iconClass: "text-brand" },
  { href: "/write-off", label: "หมดอายุ/ชำรุด", icon: AlertTriangleIcon, iconClass: "text-danger" },
];

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const mode = params.mode === "scan" ? "scan" : "type";
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const products = q
    ? await prisma.product.findMany({
        where: { storeId: user.storeId, name: { contains: q } },
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
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-1.5 rounded-[12px] border border-border bg-white px-2 py-3 text-center"
            >
              <a.icon className={`h-5 w-5 ${a.iconClass}`} />
              <span className="text-[11px] font-medium leading-tight text-foreground/80">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

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

            {products.length > 0 && (
              <div className="overflow-x-auto rounded-[14px] border border-border bg-white">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border text-left text-[10.5px] text-muted">
                      <th className="px-3.5 py-2.5 font-semibold">สินค้า</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold">ราคา</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold">คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const status = productStockStatus(p.quantity);
                      return (
                        <tr key={p.id} className="border-b border-border last:border-none">
                          <td className="px-3.5 py-2.5">
                            <div className="font-medium text-foreground">{p.name}</div>
                            <div className="text-[11px] text-muted">
                              {p.category} · หน่วยละ{p.unit}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-semibold text-foreground">฿{formatBaht(p.sellPrice)}</td>
                          <td className="px-3.5 py-2.5 text-right">
                            <span className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${status.className}`}>
                              {p.quantity} {p.unit}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {q && products.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-border bg-white px-5 py-8 text-center">
                <div className="text-[13px] text-muted">ไม่พบสินค้า &ldquo;{q}&rdquo; ในระบบ</div>
                <div className="flex w-full flex-col gap-2">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(q)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[10px] border border-border py-2.5 text-[13px] font-semibold text-foreground/75"
                  >
                    ค้นหาใน Google
                  </a>
                  <Link
                    href={`/inventory?new=${encodeURIComponent(q)}`}
                    className="rounded-[10px] bg-brand py-2.5 text-center text-[13px] font-semibold text-white"
                  >
                    + เพิ่ม &ldquo;{q}&rdquo; เป็นสินค้าใหม่
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <BarcodeScanner />
        )}
      </div>
    </div>
  );
}
