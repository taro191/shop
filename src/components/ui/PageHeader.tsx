import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-6 sm:px-8">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-muted sm:text-[13px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
