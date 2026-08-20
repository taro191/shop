import type { ComponentType, SVGProps } from "react";
import {
  DashboardIcon,
  CartIcon,
  InventoryIcon,
  CompareIcon,
  IncomeIcon,
  BillsIcon,
  ReportsIcon,
  SearchIcon,
  MoreIcon,
  UsersIcon,
  ClipboardCheckIcon,
  TagIcon,
} from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Full navigation, shown in the desktop sidebar. */
export const SIDEBAR_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: DashboardIcon },
  { href: "/sell", label: "ขายสินค้า", icon: CartIcon },
  { href: "/inventory", label: "คลังสินค้า", icon: InventoryIcon },
  { href: "/suppliers", label: "เทียบราคาซัพพลายเออร์", icon: CompareIcon },
  { href: "/income", label: "รายรับรายวัน", icon: IncomeIcon },
  { href: "/bills", label: "บิลซื้อสินค้า", icon: BillsIcon },
  { href: "/customers", label: "ลูกค้า / สมาชิก", icon: UsersIcon },
  { href: "/stock-take", label: "ตรวจนับสต๊อก", icon: ClipboardCheckIcon },
  { href: "/labels", label: "พิมพ์ป้ายราคา", icon: TagIcon },
  { href: "/reports", label: "รายงานสรุป", icon: ReportsIcon },
];

/** Daily-operation items, shown in the mobile bottom tab bar. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/sell", label: "ขายสินค้า", icon: CartIcon },
  { href: "/search", label: "ค้นหาราคา", icon: SearchIcon },
  { href: "/income", label: "รายรับ", icon: IncomeIcon },
  { href: "/bills", label: "บิลซื้อ", icon: BillsIcon },
  { href: "/more", label: "เมนู", icon: MoreIcon },
];
