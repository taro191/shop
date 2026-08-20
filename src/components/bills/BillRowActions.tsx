"use client";

import { useState, useTransition } from "react";
import { receiveBillAction, markBillPaidAction } from "@/app/(protected)/bills/actions";

export function BillRowActions({ billId, status }: { billId: string; status: "ORDERED" | "PENDING" | "PAID" | "OVERDUE" }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "PAID") return null;

  function run(action: (id: string) => Promise<{ error?: string } | null>) {
    setError(null);
    startTransition(async () => {
      const result = await action(billId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
      {error && <span className="text-[11px] text-danger">{error}</span>}
      {status === "ORDERED" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(receiveBillAction)}
          className="shrink-0 rounded-[8px] bg-brand px-3 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "รับสินค้า"}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(markBillPaidAction)}
          className="shrink-0 rounded-[8px] border border-border px-3 py-1.5 text-[11.5px] font-semibold text-foreground/70 disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "ทำเครื่องหมายชำระแล้ว"}
        </button>
      )}
    </div>
  );
}
