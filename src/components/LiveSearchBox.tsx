"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LiveSearchBox({ basePath, placeholder }: { basePath: string; placeholder: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("q")]);

  function handleChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
      });
    }, 250);
  }

  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-border bg-white px-3.5 py-3">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent text-sm outline-none"
      />
    </div>
  );
}
