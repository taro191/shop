import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function ClipboardCheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M12.6 2.6a2 2 0 0 1 1.4-.6H20a2 2 0 0 1 2 2v6a2 2 0 0 1-.6 1.4l-9 9a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1 0-2.8l9-9z" />
      <circle cx="16.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2l2.3 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M5 12h14" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M4 7h16" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M6 7l1 13.5A1.5 1.5 0 0 0 8.5 22h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.3l2.3 2.3 4.7-5" />
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function InventoryIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

export function CompareIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M7 3v11a2 2 0 0 0 2 2h11" />
      <path d="M7 8l-4 4 4 4" />
      <path d="M17 21V10a2 2 0 0 0-2-2H4" />
      <path d="M17 16l4-4-4-4" />
    </svg>
  );
}

export function IncomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <rect x="2.5" y="6" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
      <circle cx="16.5" cy="14.5" r="1.5" />
    </svg>
  );
}

export function BillsIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M6 2h12v18l-3-2-3 2-3-2-3 2V2z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  );
}

export function ReportsIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M3 21V9" />
      <path d="M10 21V3" />
      <path d="M17 21v-7" />
      <path d="M3 21h18" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function ShopIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M3 9l1.6-5.2A2 2 0 0 1 6.5 2.5h11a2 2 0 0 1 1.9 1.3L21 9" />
      <path d="M3 9h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <path d="M9 13a3 3 0 0 0 6 0" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function BarcodeIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="currentColor">
      <path d="M3 7V4a1 1 0 0 1 1-1h3" />
      <path d="M17 3h3a1 1 0 0 1 1 1v3" />
      <path d="M21 17v3a1 1 0 0 1-1 1h-3" />
      <path d="M7 21H4a1 1 0 0 1-1-1v-3" />
      <path d="M7 8v8M10 8v8M13 8v8M17 8v8" />
    </svg>
  );
}
