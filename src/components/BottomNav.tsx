"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/components/nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t border-border bg-white px-1.5 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 shadow-[0_-2px_10px_rgba(20,30,20,0.06)] md:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-1.5 ${
              active ? "text-accent-dark" : "text-muted"
            }`}
          >
            <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.3 : 2} />
            <span className={`text-[10.5px] ${active ? "font-bold" : "font-medium"}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
