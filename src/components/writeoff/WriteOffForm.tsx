"use client";

import { useMemo, useState, useTransition } from "react";
import { writeOffStockAction } from "@/app/(protected)/write-off/actions";

type ProductRow = { id: string; name: string; unit: string; quantity: number };
type Reason = "EXPIRED" | "DAMAGED" | "OTHER";

const REASONS: { value: Reason; label: string }[] = [
  { value: "EXPIRED", label: "หมดอายุ" },
  { value: "DAMAGED", label: "ชำรุด" },
  { value: "OTHER", label: "อื่นๆ" },
];

export function WriteOffForm({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState<Reason>("EXPIRED");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 30);
  }, [products, query]);

  function selectProduct(id: string) {
    setSelectedId((cur) => (cur === id ? null : id));
    setReason("EXPIRED");
    setQty("");
    setNote("");
    setError(null);
  }

  function submit(product: ProductRow) {
    const n = Math.floor(Number(qty));
    if (!n || n <= 0) {
      setError("กรุณากรอกจำนวนที่ต้องการตัดออก");
      return;
    }
    if (n > product.quantity) {
      setError(`มีในสต๊อกแค่ ${product.quantity} ${product.unit}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await writeOffStockAction({ productId: product.id, reason, quantity: n, note: note.trim() || undefined });
      if (result.ok) {
        setMessage(`บันทึกตัด "${product.name}" ออก ${n} ${product.unit} แล้ว`);
        setSelectedId(null);
        setQty("");
        setNote("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหาสินค้า..."
        className="w-full rounded-[10px] border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand"
      />

      {message && <div className="rounded-lg bg-brand-light px-3.5 py-2.5 text-[12.5px] text-brand">{message}</div>}

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {filtered.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-muted">ไม่พบสินค้า</div>}
        {filtered.map((p) => (
          <div key={p.id} className="border-t border-border first:border-none">
            <button
              type="button"
              onClick={() => selectProduct(p.id)}
              className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-foreground">{p.name}</div>
                <div className="text-[11.5px] text-muted">
                  เหลือ {p.quantity} {p.unit}
                </div>
              </div>
              <span className="shrink-0 text-[12px] font-semibold text-brand">{selectedId === p.id ? "ปิด" : "บันทึก"}</span>
            </button>

            {selectedId === p.id && (
              <div className="flex flex-col gap-3 border-t border-border bg-background px-5 py-4">
                <div className="grid grid-cols-3 gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReason(r.value)}
                      className={`rounded-[9px] border py-2 text-[12.5px] font-medium ${
                        reason === r.value ? "border-danger bg-danger-light text-danger" : "border-border text-foreground/70"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={p.quantity}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="จำนวนที่ตัดออก"
                    className="w-28 rounded-[8px] border border-border px-2.5 py-1.5 text-[13px] outline-none focus:border-brand"
                  />
                  <span className="text-[12.5px] text-muted">
                    {p.unit} (สูงสุด {p.quantity})
                  </span>
                </div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="หมายเหตุ (ถ้ามี)"
                  className="w-full rounded-[8px] border border-border px-2.5 py-1.5 text-[13px] outline-none focus:border-brand"
                />
                {error && <div className="text-[12px] text-danger">{error}</div>}
                <button
                  type="button"
                  onClick={() => submit(p)}
                  disabled={pending}
                  className="rounded-[9px] bg-danger py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "กำลังบันทึก..." : "ยืนยันตัดสต๊อก"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
