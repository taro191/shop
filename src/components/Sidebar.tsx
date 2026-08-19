"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_ITEMS } from "@/components/nav-items";
import { ShopIcon, LogoutIcon } from "@/components/icons";
import { logoutAction } from "@/app/actions/auth-actions";

export function Sidebar({
  storeName,
  plan,
  ownerName,
}: {
  storeName: string;
  plan: string;
  ownerName: string;
}) {
  const pathname = usePathname();
  const initials = ownerName.trim().slice(0, 2) || "ร้าน";

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto bg-brand-dark text-white/90 md:flex">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent">
          <ShopIcon className="h-5 w-5" stroke="#1F3A28" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-semibold text-white">
            ร้านชำ<span className="text-accent">ครบวงจร</span>
          </div>
          <div className="text-[11px] text-white/60">ระบบจัดการร้านค้า</div>
        </div>
      </div>

      <div className="mx-4 mb-4 flex flex-col gap-1 rounded-xl bg-white/[0.06] px-3.5 py-3">
        <div className="truncate text-sm font-semibold text-white">{storeName}</div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[11px] text-white/70">{plan}</span>
        </div>
      </div>

      <nav className="flex flex-grow flex-col gap-0.5 px-3">
        {SIDEBAR_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-accent font-semibold text-[#1F3A28]"
                  : "font-normal text-white/80 hover:bg-white/[0.06]"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 flex items-center gap-2.5 border-t border-white/10 px-4 py-3.5">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-brand font-display text-[13px] font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-grow leading-tight">
          <div className="truncate text-[12.5px] font-semibold text-white">{ownerName}</div>
          <div className="text-[11px] text-white/60">เจ้าของร้าน</div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="ออกจากระบบ"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.08]"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
