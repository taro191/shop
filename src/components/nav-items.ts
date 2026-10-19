import type { ComponentType, SVGProps } from "react";
import {
  DashboardIcon,
  CartIcon,
  InventoryIcon,
  CompareIcon,
  IncomeIcon,
  BillsIcon,
  ReportsIcon,
  MoreIcon,
  UsersIcon,
  ClipboardCheckIcon,
  TagIcon,
  BadgeIcon,
  MapPinIcon,
  CreditCardIcon,
  HistoryIcon,
  WalletIcon,
  AlertTriangleIcon,
  CatalogIcon,
  HomeIcon,
  TruckIcon,
} from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Only shown to the store owner — staff never see or can navigate to these. */
  ownerOnly?: boolean;
};

/** Full navigation, shown in the desktop sidebar. */
export const SIDEBAR_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: DashboardIcon },
  { href: "/sell", label: "ขายสินค้า", icon: CartIcon },
  { href: "/inventory", label: "คลังสินค้า", icon: InventoryIcon },
  { href: "/catalog", label: "คลังสินค้ากลาง", icon: CatalogIcon },
  { href: "/suppliers", label: "เทียบราคาซัพพลายเออร์", icon: CompareIcon },
  { href: "/income", label: "รายรับรายวัน", icon: IncomeIcon },
  { href: "/cashflow", label: "รายรับ-รายจ่ายทั่วไป", icon: WalletIcon },
  { href: "/bills", label: "บิลซื้อสินค้า", icon: BillsIcon },
  { href: "/receive", label: "รับสินค้าเข้าสต๊อก", icon: TruckIcon },
  { href: "/customers", label: "ลูกค้า / สมาชิก", icon: UsersIcon },
  { href: "/stock-take", label: "ตรวจนับสต๊อก", icon: ClipboardCheckIcon },
  { href: "/write-off", label: "สินค้าหมดอายุ / ชำรุด", icon: AlertTriangleIcon },
  { href: "/labels", label: "พิมพ์ป้ายราคา", icon: TagIcon },
  { href: "/reports", label: "รายงานสรุป", icon: ReportsIcon },
  { href: "/staff", label: "จัดการพนักงาน", icon: BadgeIcon, ownerOnly: true },
  { href: "/branches", label: "สาขา", icon: MapPinIcon, ownerOnly: true },
  { href: "/billing", label: "แพ็กเกจและการเรียกเก็บเงิน", icon: CreditCardIcon, ownerOnly: true },
  { href: "/audit-log", label: "ประวัติการใช้งาน", icon: HistoryIcon, ownerOnly: true },
];

/** Daily-operation items, shown in the mobile bottom tab bar. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "หน้าหลัก", icon: HomeIcon },
  { href: "/sell", label: "ขายสินค้า", icon: CartIcon },
  { href: "/stock", label: "เช็คสต๊อก", icon: InventoryIcon },
  { href: "/receive", label: "รับสินค้า", icon: TruckIcon },
  { href: "/more", label: "เมนู", icon: MoreIcon },
];
