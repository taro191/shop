"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SellScanner } from "@/components/sell/SellScanner";
import { TrashIcon } from "@/components/icons";
import { quickReceiveAction, type QuickReceiveInput } from "@/app/(protected)/receive/actions";
import { CatalogFallback } from "@/components/catalog/CatalogFallback";
import type { AddedProduct } from "@/app/(protected)/catalog/actions";
import { formatStock } from "@/lib/packs";

type PackRow = { id: string; name: string; size: number; barcode: string | null };
type ProductRow = { id: string; name: string; unit: string; barcode: string | null; costPrice: number; quantity: number; packs: PackRow[] };
type SupplierRow = { id: string; name: string };
/** One received line; packId is set when counted in ลัง/แพ็ค (qty and cost are then per pack). */
type Line = { id: number; productId: string; packId: string | null; qty: string; cost: string };

let nextLineId = 1;

export function ReceiveForm({ products: storeProducts, suppliers }: { products: ProductRow[]; suppliers: SupplierRow[] }) {
  const router = useRouter();
  // Products pulled in from the shared catalog during this visit, until the page refreshes.
  const [pulled, setPulled] = useState<ProductRow[]>([]);
  const products = useMemo(
    () => [...storeProducts, ...pulled.filter((p) => !storeProducts.some((s) => s.id === p.id))],
    [storeProducts, pulled],
  );
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [unknownCode, setUnknownCode] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [billNo, setBillNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  // Product and pack barcodes: scanning a case's barcode adds one case.
  const byBarcode = useMemo(() => {
    const map = new Map<string, { product: ProductRow; pack: PackRow | null }>();
    for (const p of products) {
      if (p.barcode) map.set(p.barcode, { product: p, pack: null });
      for (const pack of p.packs) if (pack.barcode) map.set(pack.barcode, { product: p, pack });
    }
    return map;
  }, [products]);

  const addProduct = useCallback((p: ProductRow, pack: PackRow | null = null) => {
    setMessage(null);
    setLines((cur) => {
      const i = cur.findIndex((l) => l.productId === p.id && l.packId === (pack?.id ?? null));
      if (i === -1) {
        const cost = String(Math.round(p.costPrice * (pack?.size ?? 1) * 100) / 100);
        return [{ id: nextLineId++, productId: p.id, packId: pack?.id ?? null, qty: "1", cost }, ...cur];
      }
      const next = [...cur];
      next[i] = { ...next[i], qty: String((Number(next[i].qty) || 0) + 1) };
      return next;
    });
  }, []);

  const onScan = useCallback(
    (code: string) => {
      const hit = byBarcode.get(code);
      if (hit) {
        setUnknownCode(null);
        addProduct(hit.product, hit.pack);
      } else {
        setUnknownCode(code);
      }
    },
    [byBarcode, addProduct],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.barcode === q).slice(0, 8);
  }, [products, query]);

  function addFromCatalog(product: AddedProduct) {
    const row = { ...product, packs: [] };
    setPulled((cur) => [...cur, row]);
    addProduct(row);
    setUnknownCode(null);
    setQuery("");
    router.refresh();
  }

  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.cost) || 0), 0);

  function update(id: number, patch: Partial<Line>) {
    setLines((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  /** Switches a line between single units and a pack, re-pricing the cost to match. */
  function changeUnit(line: Line, packId: string | null) {
    const p = byId.get(line.productId)!;
    const oldSize = p.packs.find((x) => x.id === line.packId)?.size ?? 1;
    const newSize = p.packs.find((x) => x.id === packId)?.size ?? 1;
    const perUnit = (Number(line.cost) || 0) / oldSize;
    update(line.id, { packId, cost: String(Math.round(perUnit * newSize * 100) / 100) });
  }

  function submit() {
    const lineItems: QuickReceiveInput["lineItems"] = [];
    for (const l of lines) {
      const p = byId.get(l.productId)!;
      const pack = p.packs.find((x) => x.id === l.packId) ?? null;
      const quantity = Math.floor(Number(l.qty));
      const unitPrice = Number(l.cost);
      if (!quantity || quantity <= 0) return setError(`กรุณากรอกจำนวนของ "${p.name}"`);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return setError(`ราคาทุนของ "${p.name}" ไม่ถูกต้อง`);
      lineItems.push({ productId: p.id, quantity, unit: pack?.name ?? p.unit, packId: pack?.id, unitPrice });
    }
    setError(null);
    startTransition(async () => {
      const result = await quickReceiveAction({ supplierId: supplierId || null, billNo, lineItems });
      if (result.ok) {
        setMessage(`รับสินค้าเข้าสต๊อกแล้ว ${lineItems.length} รายการ`);
        setLines([]);
        setBillNo("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {message && <div className="rounded-lg bg-brand-light px-3.5 py-2.5 text-[12.5px] font-medium text-brand">{message}</div>}

      {showScanner ? (
        <div className="flex flex-col gap-2">
          <SellScanner onDetect={onScan} flashText="เพิ่มในรายการรับแล้ว" />
          <button type="button" onClick={() => setShowScanner(false)} className="text-[12.5px] font-semibold text-muted">
            ซ่อนสแกนเนอร์
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="rounded-[13px] bg-accent py-3.5 text-[14px] font-bold text-[#1F3A28]"
        >
          สแกนบาร์โค้ดสินค้าที่รับเข้า
        </button>
      )}

      {unknownCode && (
        <div className="flex flex-col gap-2">
          <div className="text-[12.5px] text-accent-dark">ไม่พบบาร์โค้ด {unknownCode} ในร้าน</div>
          <CatalogFallback key={unknownCode} q={unknownCode} onAdded={addFromCatalog} />
        </div>
      )}

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="หรือพิมพ์ชื่อสินค้าเพื่อเพิ่ม..."
          className="w-full rounded-[10px] border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand"
        />
        {query.trim().length >= 2 && matches.length === 0 && (
          <div className="mt-2">
            <CatalogFallback q={query} onAdded={addFromCatalog} />
          </div>
        )}
        {matches.length > 0 && (
          <div className="mt-1 overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  addProduct(p);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-3 border-t border-border px-3.5 py-2.5 text-left first:border-none"
              >
                <span className="truncate text-[13px] text-foreground">{p.name}</span>
                <span className="shrink-0 text-[11.5px] text-muted">
                  มี {formatStock(p.quantity, p.unit, p.packs)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-display text-[14.5px] font-semibold text-foreground">รายการรับเข้า</span>
          <span className="text-[12px] text-muted">{lines.length} รายการ</span>
        </div>
        {lines.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12.5px] text-muted">สแกนหรือค้นหาสินค้าเพื่อเริ่มรับของ</div>
        ) : (
          lines.map((l) => {
            const p = byId.get(l.productId)!;
            const pack = p.packs.find((x) => x.id === l.packId) ?? null;
            const qty = Math.floor(Number(l.qty)) || 0;
            return (
              <div key={l.id} className="border-t border-border px-4 py-3 first:border-none">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-foreground">{p.name}</div>
                    <div className="text-[11px] text-muted">
                      คงเหลือตอนนี้ {formatStock(p.quantity, p.unit, p.packs)}
                      {pack && qty > 0 && (
                        <span className="font-semibold text-brand">
                          {" "}
                          · รับเพิ่ม {(qty * pack.size).toLocaleString("th-TH")} {p.unit}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="ลบรายการ"
                    onClick={() => setLines((cur) => cur.filter((x) => x.id !== l.id))}
                    className="p-1 text-muted"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className={`mt-2 grid gap-2 ${p.packs.length > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
                  {p.packs.length > 0 && (
                    <label className="text-[11px] text-muted">
                      รับเป็น
                      <select
                        value={l.packId ?? ""}
                        onChange={(e) => changeUnit(l, e.target.value || null)}
                        className="mt-0.5 w-full rounded-[8px] border border-border bg-white px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-brand"
                      >
                        <option value="">{p.unit}</option>
                        {p.packs.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name} ({x.size} {p.unit})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="text-[11px] text-muted">
                    จำนวน ({pack?.name ?? p.unit})
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={l.qty}
                      onChange={(e) => update(l.id, { qty: e.target.value })}
                      className="mt-0.5 w-full rounded-[8px] border border-border px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-brand"
                    />
                  </label>
                  <label className="text-[11px] text-muted">
                    ทุน/{pack?.name ?? p.unit} (บาท)
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={l.cost}
                      onChange={(e) => update(l.id, { cost: e.target.value })}
                      className="mt-0.5 w-full rounded-[8px] border border-border px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-brand"
                    />
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>

      {lines.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4">
          <label className="text-[12px] font-semibold text-muted">
            ซัพพลายเออร์
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-1 w-full rounded-[9px] border border-border bg-white px-3 py-2.5 text-[13px] font-normal text-foreground outline-none focus:border-brand"
            >
              <option value="">ไม่ระบุ</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] font-semibold text-muted">
            เลขที่บิล (ถ้ามี)
            <input
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              placeholder="เว้นว่างได้ ระบบจะตั้งให้"
              className="mt-1 w-full rounded-[9px] border border-border px-3 py-2.5 text-[13px] font-normal text-foreground outline-none focus:border-brand"
            />
          </label>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">รวมต้นทุน</span>
            <span className="font-display text-[17px] font-bold text-foreground">
              ฿{total.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
            </span>
          </div>
          {error && <div className="text-[12px] text-danger">{error}</div>}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="rounded-[11px] bg-brand py-3 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {pending ? "กำลังบันทึก..." : "ยืนยันรับสินค้าเข้าสต๊อก"}
          </button>
        </div>
      )}
    </div>
  );
}
