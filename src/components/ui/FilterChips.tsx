import Link from "next/link";

export function FilterChips({
  basePath,
  paramName,
  options,
  current,
  otherParams,
  labelFor,
  allValue = "ทั้งหมด",
}: {
  basePath: string;
  paramName: string;
  options: string[];
  current: string;
  otherParams?: Record<string, string | undefined>;
  labelFor?: (opt: string) => string;
  allValue?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = current === opt;
        const params = new URLSearchParams();
        if (opt !== allValue) params.set(paramName, opt);
        for (const [k, v] of Object.entries(otherParams ?? {})) {
          if (v) params.set(k, v);
        }
        const qs = params.toString();
        return (
          <Link
            key={opt}
            href={qs ? `${basePath}?${qs}` : basePath}
            prefetch={false}
            className={`rounded-[9px] px-4 py-2 text-[12.5px] font-medium ${
              active ? "bg-brand text-white" : "border border-border bg-white text-foreground/70"
            }`}
          >
            {labelFor ? labelFor(opt) : opt}
          </Link>
        );
      })}
    </div>
  );
}
