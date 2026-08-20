"use client";

import { useMemo, useState } from "react";
import { BarcodeLabel } from "@/components/BarcodeLabel";

type ProductRow = { id: string; name: string; unit: string; sellPrice: number; barcode: string | null };

export function LabelsPicker({ products, storeName }: { products: ProductRow[]; storeName: string }) {
  const [selected, setSelected] = useState<Map<string, number>>(new Map());
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const labels = useMemo(() => {
    const out: ProductRow[] = [];
    for (const p of products) {
      const copies = selected.get(p.id);
      if (copies) for (let i = 0; i < copies; i++) out.push(p);
    }
    return out;
  }, [products, selected]);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) next.set(id, next.get(id) ?? 1);
      else next.delete(id);
      return next;
    });
  }

  function setCopies(id: string, copies: number) {
    setSelected((prev) => new Map(prev).set(id, Math.max(1, copies)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาสินค้า..."
          className="w-full max-w-xs rounded-[10px] border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand sm:w-auto"
        />
        <button
          type="button"
          onClick={() => window.print()}
          disabled={labels.length === 0}
          className="rounded-[10px] bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
        >
          พิมพ์ป้าย ({labels.length} ดวง)
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white print:hidden">
        <div className="hidden grid-cols-[36px_1.6fr_1fr_100px] gap-3 border-b border-border px-5 py-2.5 text-[11.5px] text-muted sm:grid">
          <span></span>
          <span>สินค้า</span>
          <span>บาร์โค้ด</span>
          <span>จำนวนดวง</span>
        </div>
        {filtered.map((p) => {
          const checked = selected.has(p.id);
          return (
            <div
              key={p.id}
              className="flex flex-col gap-2 border-t border-border px-5 py-3 first:border-none sm:grid sm:grid-cols-[36px_1.6fr_1fr_100px] sm:items-center sm:gap-3"
            >
              <input type="checkbox" checked={checked} onChange={(e) => toggle(p.id, e.target.checked)} className="h-4 w-4 accent-brand" />
              <span className="text-[13px] font-medium text-foreground">
                {p.name} <span className="text-muted">· ฿{p.sellPrice}</span>
              </span>
              <span className="text-[12.5px] text-muted">{p.barcode ?? "ไม่มีบาร์โค้ด"}</span>
              <input
                type="number"
                min={1}
                disabled={!checked}
                value={selected.get(p.id) ?? 1}
                onChange={(e) => setCopies(p.id, Number(e.target.value) || 1)}
                className="w-20 rounded-[8px] border border-border px-2.5 py-1.5 text-[13px] outline-none focus:border-brand disabled:opacity-40"
              />
            </div>
          );
        })}
        {filtered.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-muted">ไม่พบสินค้า</div>}
      </div>

      {labels.length > 0 && (
        <div id="labels-print" className="flex flex-wrap gap-2 print:gap-1.5">
          {labels.map((p, i) => (
            <BarcodeLabel key={`${p.id}-${i}`} name={p.name} price={p.sellPrice} unit={p.unit} barcode={p.barcode} storeName={storeName} />
          ))}
        </div>
      )}
    </div>
  );
}
