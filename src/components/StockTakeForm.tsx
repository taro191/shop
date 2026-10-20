"use client";

import { useMemo, useState, useTransition } from "react";
import { submitStockTake } from "@/app/(protected)/stock-take/actions";
import { formatStock, sortPacks } from "@/lib/packs";

type PackRow = { id: string; name: string; size: number };
type ProductRow = { id: string; name: string; unit: string; category: string; quantity: number; packs: PackRow[] };

export function StockTakeForm({ products }: { products: ProductRow[] }) {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  // For products with packs: what was typed per pack ("" key = loose units), so the
  // count can be entered as "2 ลัง 10 ขวด" instead of multiplying by hand.
  const [parts, setParts] = useState<Map<string, Record<string, string>>>(new Map());
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const changedCount = useMemo(() => {
    let n = 0;
    for (const p of products) {
      const counted = counts.get(p.id);
      if (counted !== undefined && counted !== p.quantity) n++;
    }
    return n;
  }, [counts, products]);

  function setCount(productId: string, value: string) {
    const n = Math.max(0, Number(value) || 0);
    setCounts((prev) => new Map(prev).set(productId, n));
  }

  function setPart(product: ProductRow, key: string, value: string) {
    const next = { ...parts.get(product.id), [key]: value };
    setParts((prev) => new Map(prev).set(product.id, next));
    const total = sortPacks(product.packs).reduce(
      (sum, pack) => sum + Math.max(0, Math.floor(Number(next[pack.id]) || 0)) * pack.size,
      Math.max(0, Math.floor(Number(next[""]) || 0)),
    );
    setCounts((prev) => new Map(prev).set(product.id, total));
  }

  function submit() {
    setError(null);
    setMessage(null);
    const adjustments = products
      .filter((p) => counts.has(p.id) && counts.get(p.id) !== p.quantity)
      .map((p) => ({ productId: p.id, actualQty: counts.get(p.id)! }));

    if (adjustments.length === 0) {
      setError("ยังไม่มีรายการที่นับต่างจากระบบ");
      return;
    }

    startTransition(async () => {
      const result = await submitStockTake({ reason, adjustments });
      if (result.ok) {
        setMessage(`บันทึกการปรับปรุงสต๊อก ${result.changed} รายการแล้ว`);
        setCounts(new Map());
        setParts(new Map());
        setReason("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาสินค้า..."
          className="flex-1 rounded-[10px] border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="เหตุผล เช่น ตรวจนับสต๊อกประจำเดือน"
          className="flex-1 rounded-[10px] border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>

      {error && <div className="rounded-lg bg-danger-light px-3.5 py-2.5 text-[12.5px] text-danger">{error}</div>}
      {message && <div className="rounded-lg bg-brand-light px-3.5 py-2.5 text-[12.5px] text-brand">{message}</div>}

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="hidden grid-cols-[1.4fr_1fr_1.6fr_0.8fr] gap-3 border-b border-border px-5 py-2.5 text-[11.5px] text-muted sm:grid">
          <span>สินค้า</span>
          <span>ในระบบ</span>
          <span>นับได้จริง</span>
          <span>ผลต่าง</span>
        </div>
        {filtered.map((p) => {
          const counted = counts.get(p.id);
          const diff = counted !== undefined ? counted - p.quantity : 0;
          const packs = sortPacks(p.packs);
          return (
            <div
              key={p.id}
              className={`flex flex-col gap-2 border-t border-border px-5 py-3 first:border-none sm:grid sm:grid-cols-[1.4fr_1fr_1.6fr_0.8fr] sm:items-center sm:gap-3 ${
                diff !== 0 ? "bg-accent-light/40" : ""
              }`}
            >
              <div>
                <div className="text-[13px] font-medium text-foreground">{p.name}</div>
                <div className="text-[11px] text-muted">{p.category}</div>
              </div>
              <span className="text-[13px] text-muted">{formatStock(p.quantity, p.unit, packs)}</span>
              {packs.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  {[...packs, { id: "", name: p.unit, size: 1 }].map((pack) => (
                    <label key={pack.id} className="flex items-center gap-1 text-[12px] text-muted">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        value={parts.get(p.id)?.[pack.id] ?? ""}
                        onChange={(e) => setPart(p, pack.id, e.target.value)}
                        className="w-14 rounded-[8px] border border-border px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-brand"
                      />
                      {pack.name}
                    </label>
                  ))}
                  {counted !== undefined && (
                    <span className="text-[11.5px] text-muted">
                      = {counted.toLocaleString("th-TH")} {p.unit}
                    </span>
                  )}
                </div>
              ) : (
                <input
                  type="number"
                  min={0}
                  placeholder={String(p.quantity)}
                  value={counted ?? ""}
                  onChange={(e) => setCount(p.id, e.target.value)}
                  className="w-24 rounded-[8px] border border-border px-2.5 py-1.5 text-[13px] outline-none focus:border-brand"
                />
              )}
              <span className={`text-[13px] font-semibold ${diff > 0 ? "text-brand" : diff < 0 ? "text-danger" : "text-muted"}`}>
                {counted !== undefined ? `${diff > 0 ? "+" : ""}${diff} ${p.unit}` : "—"}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-muted">ไม่พบสินค้า</div>}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4">
        <span className="text-[13px] text-muted">{changedCount > 0 ? `${changedCount} รายการนับต่างจากระบบ` : "ยังไม่มีรายการที่ต่างจากระบบ"}</span>
        <button
          type="button"
          onClick={submit}
          disabled={pending || changedCount === 0}
          className="rounded-[10px] bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกการปรับปรุงสต๊อก"}
        </button>
      </div>
    </div>
  );
}
