import type { ComponentType, SVGProps } from "react";
import {
  DashboardIcon,
  InventoryIcon,
  CompareIcon,
  IncomeIcon,
  BillsIcon,
  ReportsIcon,
  SearchIcon,
  MoreIcon,
} from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Full navigation, shown in the desktop sidebar. */
export const SIDEBAR_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: DashboardIcon },
  { href: "/inventory", label: "คลังสินค้า", icon: InventoryIcon },
  { href: "/suppliers", label: "เทียบราคาซัพพลายเออร์", icon: CompareIcon },
  { href: "/income", label: "รายรับรายวัน", icon: IncomeIcon },
  { href: "/bills", label: "บิลซื้อสินค้า", icon: BillsIcon },
  { href: "/reports", label: "รายงานสรุป", icon: ReportsIcon },
];

/** Daily-operation items, shown in the mobile bottom tab bar. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/search", label: "ค้นหาราคา", icon: SearchIcon },
  { href: "/income", label: "รายรับ", icon: IncomeIcon },
  { href: "/bills", label: "บิลซื้อ", icon: BillsIcon },
  { href: "/more", label: "เมนู", icon: MoreIcon },
];
