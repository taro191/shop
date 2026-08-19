import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { planLabel } from "@/lib/format";
import { logoutAction } from "@/app/actions/auth-actions";
import { InventoryIcon, CompareIcon, ReportsIcon, DashboardIcon, LogoutIcon, ChevronRightIcon } from "@/components/icons";

const DESKTOP_LINKS = [
  { href: "/dashboard", label: "แดชบอร์ด", desc: "ภาพรวมร้านค้าและยอดขาย", icon: DashboardIcon },
  { href: "/inventory", label: "คลังสินค้า", desc: "จัดการสต๊อกและราคาสินค้า", icon: InventoryIcon },
  { href: "/suppliers", label: "เทียบราคาซัพพลายเออร์", desc: "หาต้นทุนที่ถูกที่สุด", icon: CompareIcon },
  { href: "/reports", label: "รายงานสรุปซื้อขาย", desc: "รายวัน รายเดือน รายไตรมาส", icon: ReportsIcon },
];

export default async function MorePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const initials = user.name.trim().slice(0, 2) || "ร้าน";

  return (
    <div className="mx-auto max-w-[520px] pb-10">
      <PageHeader title="เมนู" />

      <div className="px-5 pt-4 sm:px-8">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-dark p-5">
          <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-brand font-display text-base font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14.5px] font-semibold text-white">{user.store.name}</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[11.5px] text-white/70">{planLabel(user.store.plan)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 sm:px-8">
        <div className="mb-2.5 px-0.5 text-xs font-semibold text-muted">จัดการร้าน (แนะนำใช้บนคอมพิวเตอร์)</div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          {DESKTOP_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-none"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-light">
                <item.icon className="h-[18px] w-[18px] text-brand" />
              </div>
              <div className="flex-grow">
                <div className="text-[13.5px] font-medium text-foreground">{item.label}</div>
                <div className="mt-0.5 text-[11px] text-muted">{item.desc}</div>
              </div>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      </div>

      <div className="px-5 pt-6 sm:px-8">
        <div className="mb-2.5 px-0.5 text-xs font-semibold text-muted">บัญชี</div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-grow">
              <div className="text-[13.5px] font-medium text-foreground">{user.name}</div>
              <div className="mt-0.5 text-[11px] text-muted">{user.role === "OWNER" ? "เจ้าของร้าน" : "พนักงาน"} · {user.phone}</div>
            </div>
          </div>
          <form action={logoutAction} className="border-t border-border">
            <button type="submit" className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-danger-light">
                <LogoutIcon className="h-[18px] w-[18px] text-danger" />
              </div>
              <span className="text-[13.5px] font-medium text-danger">ออกจากระบบ</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
