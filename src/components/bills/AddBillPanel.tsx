"use client";

import { useMemo, useState, useTransition } from "react";
import { createBill } from "@/app/(protected)/bills/actions";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { formatBaht } from "@/lib/format";
import { PRODUCT_UNITS } from "@/lib/constants";

type ProductRow = { id: string; name: string; unit: string; costPrice: number };
type Supplier = { id: string; name: string };
type Line = { productId: string; name: string; quantity: number; unit: string; unitPrice: number };

export function AddBillPanel({ products, suppliers }: { products: ProductRow[]; suppliers: Supplier[] }) {
  const [open, setOpen] = useState(false);
  const [billNo, setBillNo] = useState("");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [receivedNow, setReceivedNow] = useState(true);
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 15);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 15);
  }, [products, query]);

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  function reset() {
    setBillNo("");
    setSupplierId(suppliers[0]?.id ?? "");
    setReceivedNow(true);
    setLines([]);
    setQuery("");
    setError(null);
  }

  function addLine(product: ProductRow) {
    setLines((prev) => {
      if (prev.some((l) => l.productId === product.id)) return prev;
      return [...prev, { productId: product.id, name: product.name, quantity: 1, unit: product.unit, unitPrice: product.costPrice }];
    });
  }

  function updateLine(productId: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function submit() {
    setError(null);
    if (!billNo.trim()) return setError("กรุณากรอกเลขที่บิล");
    if (!supplierId) return setError("กรุณาเลือกซัพพลายเออร์");
    if (lines.length === 0) return setError("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");

    startTransition(async () => {
      const result = await createBill({
        billNo: billNo.trim(),
        supplierId,
        receivedNow,
        lineItems: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unit: l.unit, unitPrice: l.unitPrice })),
      });
      if (result.ok) {
        reset();
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-white"
      >
        <PlusIcon className="h-4 w-4" strokeWidth={2.3} />
        เพิ่มบิลใหม่
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex justify-end">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          />
          <div className="relative flex h-full w-full max-w-[440px] flex-col bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <span className="font-display text-[17px] font-semibold text-foreground">เพิ่มบิลซื้อสินค้า</span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 hover:bg-background"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-grow flex-col gap-4 overflow-y-auto px-6 py-5">
              {error && <div className="rounded-lg bg-danger-light px-3.5 py-2.5 text-[12.5px] text-danger">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-muted">เลขที่บิล</label>
                  <input
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="เช่น INV-1042"
                    className="w-full rounded-[9px] border border-border px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-muted">ซัพพลายเออร์</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full rounded-[9px] border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-muted">ค้นหาสินค้าเพื่อเพิ่มลงบิล</label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="พิมพ์ชื่อสินค้า..."
                  className="mb-2 w-full rounded-[9px] border border-border px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                />
                <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-[9px] border border-border p-1.5">
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addLine(p)}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] hover:bg-background"
                    >
                      <span className="truncate text-foreground/85">{p.name}</span>
                      <PlusIcon className="h-3.5 w-3.5 shrink-0 text-brand" />
                    </button>
                  ))}
                  {filtered.length === 0 && <div className="px-2.5 py-2 text-[12px] text-muted">ไม่พบสินค้า</div>}
                </div>
              </div>

              {lines.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {lines.map((l) => (
                    <div key={l.productId} className="rounded-[10px] border border-border p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="truncate text-[12.5px] font-medium text-foreground">{l.name}</span>
                        <button type="button" onClick={() => removeLine(l.productId)} className="shrink-0 text-danger">
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="mb-1 block text-[10.5px] text-muted">จำนวน</label>
                          <input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) => updateLine(l.productId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-full rounded-md border border-border px-2 py-1.5 text-[12.5px] outline-none focus:border-brand"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10.5px] text-muted">หน่วย</label>
                          <select
                            value={l.unit}
                            onChange={(e) => updateLine(l.productId, { unit: e.target.value })}
                            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-[12.5px] outline-none focus:border-brand"
                          >
                            {PRODUCT_UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10.5px] text-muted">ราคา/หน่วย</label>
                          <input
                            type="number"
                            min={0}
                            value={l.unitPrice}
                            onChange={(e) => updateLine(l.productId, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-full rounded-md border border-border px-2 py-1.5 text-[12.5px] outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                      <div className="mt-1.5 text-right text-[12px] text-muted">รวม ฿{formatBaht(l.quantity * l.unitPrice)}</div>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-2.5 rounded-[10px] border border-border p-3">
                <input type="checkbox" checked={receivedNow} onChange={(e) => setReceivedNow(e.target.checked)} className="h-4 w-4 accent-brand" />
                <span className="text-[12.5px] text-foreground/80">
                  ได้รับสินค้าแล้ว (ตัดเข้าสต๊อกทันที) — ถ้ายังไม่ได้รับของ ให้ปิดตัวเลือกนี้เพื่อบันทึกเป็นใบสั่งซื้อก่อน
                </span>
              </label>
            </div>

            <div className="border-t border-border px-6 py-4">
              <div className="mb-3 flex items-center justify-between text-[14px] font-semibold text-foreground">
                <span>ยอดรวม</span>
                <span>฿{formatBaht(total)}</span>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  className="flex-1 rounded-[10px] border border-border py-2.5 text-[13px] font-semibold text-foreground/70"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className="flex-1 rounded-[10px] bg-brand py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
                >
                  {pending ? "กำลังบันทึก..." : receivedNow ? "บันทึกและรับสินค้า" : "บันทึกใบสั่งซื้อ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
