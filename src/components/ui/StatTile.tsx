import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  hint,
  hintClassName = "text-muted",
  icon,
  iconBg = "bg-brand-light",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintClassName?: string;
  icon?: ReactNode;
  iconBg?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-muted">{label}</span>
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-[9px] ${iconBg}`}>{icon}</div>
        )}
      </div>
      <div className="font-display text-2xl font-semibold text-foreground">{value}</div>
      {hint && <div className={`text-xs ${hintClassName}`}>{hint}</div>}
    </div>
  );
}
