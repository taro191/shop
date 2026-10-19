import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDashboardStats } from "@/lib/queries";
import { formatBaht, formatThaiDate } from "@/lib/format";
import {
  CartIcon,
  InventoryIcon,
  TruckIcon,
  WalletIcon,
  ShieldIcon,
  SearchIcon,
  ClipboardCheckIcon,
  AlertTriangleIcon,
  CatalogIcon,
  ChevronRightIcon,
} from "@/components/icons";

type Tile = {
  href: string;
  label: string;
  desc: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
};

const SHORTCUTS = [
  { href: "/search", label: "เช็คราคา", icon: SearchIcon },
  { href: "/stock-take", label: "ตรวจนับ", icon: ClipboardCheckIcon },
  { href: "/write-off", label: "หมดอายุ/ชำรุด", icon: AlertTriangleIcon },
  { href: "/catalog", label: "คลังกลาง", icon: CatalogIcon },
];

/** Mobile home screen — big buttons for the day-to-day jobs done on a phone at the
 * counter. Phones are redirected here from /dashboard (see src/proxy.ts). */
export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const isOwner = user.role === "OWNER";

  const [stats, toReceive] = await Promise.all([
    getDashboardStats(user.storeId),
    prisma.purchaseBill.count({ where: { storeId: user.storeId, status: "ORDERED" } }),
  ]);

  const tiles: Tile[] = [
    { href: "/stock", label: "เช็คสต๊อก", desc: "ดูของใกล้หมด หมดอายุ", icon: InventoryIcon, badge: stats.lowStockCount > 0 ? `${stats.lowStockCount} ใกล้หมด` : undefined },
    { href: "/receive", label: "รับสินค้า", desc: "สแกนของเข้าสต๊อก", icon: TruckIcon, badge: toReceive > 0 ? `${toReceive} รอรับ` : undefined },
    { href: "/cashflow", label: "รายรับ-จ่าย", desc: "ค่าน้ำไฟ ค่าเช่า อื่นๆ", icon: WalletIcon },
  ];
  if (isOwner) tiles.push({ href: "/dashboard?full=1", label: "Admin", desc: "แดชบอร์ด รายงาน จัดการร้าน", icon: ShieldIcon });

  return (
    <div className="mx-auto max-w-[520px] pb-10">
      <div className="px-5 pt-6 sm:px-8">
        <div className="text-[12px] text-muted">{formatThaiDate(new Date())}</div>
        <h1 className="mt-0.5 truncate font-display text-xl font-semibold text-foreground">{user.store.name}</h1>
        <p className="text-[12.5px] text-muted">สวัสดี {user.name}</p>
      </div>

      <div className="px-5 pt-4 sm:px-8">
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-brand-dark p-4">
          <div>
            <div className="text-[11.5px] text-white/65">ยอดขายวันนี้</div>
            <div className="mt-0.5 font-display text-[22px] font-bold text-white">฿{formatBaht(stats.todayTotal)}</div>
          </div>
          <div>
            <div className="text-[11.5px] text-white/65">จำนวนบิลวันนี้</div>
            <div className="mt-0.5 font-display text-[22px] font-bold text-white">{stats.todayCount}</div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 sm:px-8">
        <Link
          href="/sell"
          className="flex items-center gap-4 rounded-2xl bg-accent px-5 py-5 text-[#1F3A28] shadow-sm active:opacity-90"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/45">
            <CartIcon className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-grow">
            <div className="font-display text-[18px] font-bold">ขายหน้าร้าน</div>
            <div className="text-[12px] opacity-80">สแกนบาร์โค้ด คิดเงิน รับเงินสด/พร้อมเพย์</div>
          </div>
          <ChevronRightIcon className="h-5 w-5 shrink-0" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pt-3 sm:px-8">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="relative flex min-h-[118px] flex-col justify-between rounded-2xl border border-border bg-white p-4 active:bg-background"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light">
              <t.icon className="h-[21px] w-[21px] text-brand" />
            </div>
            <div className="mt-3">
              <div className="font-display text-[15.5px] font-semibold text-foreground">{t.label}</div>
              <div className="text-[11.5px] leading-snug text-muted">{t.desc}</div>
            </div>
            {t.badge && (
              <span className="absolute right-3 top-3 rounded-md bg-accent-light px-2 py-0.5 text-[10.5px] font-semibold text-accent-dark">
                {t.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="px-5 pt-5 sm:px-8">
        <div className="mb-2.5 text-xs font-semibold text-muted">ทางลัด</div>
        <div className="grid grid-cols-4 gap-2">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex flex-col items-center gap-1.5 rounded-[12px] border border-border bg-white px-1 py-3 text-center"
            >
              <s.icon className="h-5 w-5 text-brand" />
              <span className="text-[10.5px] font-medium leading-tight text-foreground/80">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
