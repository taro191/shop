"use client";

import { useState, useTransition } from "react";
import { updateProductPriceAction } from "@/app/(protected)/inventory/actions";

const input = "mt-1 w-full rounded-[9px] border border-border bg-white px-3 py-2 text-[13px] font-normal text-foreground outline-none focus:border-brand";
const label = "text-[11.5px] font-semibold text-muted";

/** Edits a product's sell and cost price per base unit. Opens straight away for a
 * product with no price yet (added from the catalog by a scan). */
export function PriceEditor({ productId, unit, sellPrice, costPrice }: { productId: string; unit: string; sellPrice: number; costPrice: number }) {
  const unpriced = sellPrice === 0;
  const [open, setOpen] = useState(unpriced);
  const [sell, setSell] = useState(unpriced ? "" : String(sellPrice));
  const [cost, setCost] = useState(costPrice === 0 ? "" : String(costPrice));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateProductPriceAction({ productId, sellPrice: sell, costPrice: cost });
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[12.5px] font-semibold text-brand">
        แก้ราคา
      </button>
    );
  }

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 ${unpriced ? "border-accent bg-accent-light" : "border-border bg-white"}`}>
      <div className="text-[12.5px] font-semibold text-foreground">
        {unpriced ? "สินค้านี้ยังไม่ได้ตั้งราคา — กรอกราคาก่อนขาย" : "แก้ราคา"}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          ราคาขาย / {unit}
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={sell}
            onChange={(e) => setSell(e.target.value)}
            autoFocus={unpriced}
            className={input}
          />
        </label>
        <label className={label}>
          ราคาทุน / {unit} (ไม่บังคับ)
          <input type="number" inputMode="decimal" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className={input} />
        </label>
      </div>
      {error && <div className="text-[12px] text-danger">{error}</div>}
      <button
        type="button"
        onClick={save}
        disabled={pending || sell.trim() === ""}
        className="rounded-[10px] bg-brand py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกราคา"}
      </button>
    </div>
  );
}
