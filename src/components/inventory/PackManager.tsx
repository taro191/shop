"use client";

import { useState, useTransition } from "react";
import { addPackAction, deletePackAction } from "@/app/(protected)/inventory/actions";
import { PACK_UNITS, packPrice, type Pack } from "@/lib/packs";
import { formatBaht } from "@/lib/format";
import { TrashIcon } from "@/components/icons";

const input = "mt-1 w-full rounded-[9px] border border-border bg-white px-3 py-2 text-[13px] font-normal text-foreground outline-none focus:border-brand";
const label = "text-[11.5px] font-semibold text-muted";

/** Lists a product's packaging units (ลัง = 24 ขวด) and adds or removes them. */
export function PackManager({
  productId,
  unit,
  sellPrice,
  costPrice,
  packs,
}: {
  productId: string;
  unit: string;
  sellPrice: number;
  costPrice: number;
  packs: Pack[];
}) {
  const unused = PACK_UNITS.filter((n) => n !== unit && !packs.some((p) => p.name === n));
  const [chosen, setName] = useState(unused[0] ?? "");
  // The chosen name drops out of the list once added; fall back to the next free one.
  const name = unused.includes(chosen) ? chosen : (unused[0] ?? "");
  const [size, setSize] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sizeNum = Math.floor(Number(size));
  const defaultPrice = sizeNum > 1 ? sizeNum * sellPrice : null;

  function add() {
    setError(null);
    startTransition(async () => {
      const result = await addPackAction({ productId, name, size, barcode, sellPrice: price });
      if (result.ok) {
        setSize("");
        setBarcode("");
        setPrice("");
      } else {
        setError(result.error);
      }
    });
  }

  function remove(pack: Pack) {
    setError(null);
    startTransition(async () => {
      const result = await deletePackAction(pack.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="border-b border-border px-5 py-4">
        <div className="font-display text-[15px] font-semibold text-foreground">หน่วยบรรจุ (ลัง / แพ็ค)</div>
        <div className="mt-0.5 text-[12px] text-muted">
          สต๊อกนับเป็น{unit}เสมอ หน่วยบรรจุใช้รับของ ขาย และตรวจนับเป็นลังหรือแพ็คได้ โดยระบบคูณจำนวนให้
        </div>
      </div>

      {packs.length === 0 ? (
        <div className="px-5 py-5 text-[12.5px] text-muted">ยังไม่มีหน่วยบรรจุ</div>
      ) : (
        packs.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 first:border-none">
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold text-foreground">
                1 {p.name} = {p.size} {unit}
              </div>
              <div className="text-[11.5px] text-muted">
                ขาย ฿{formatBaht(packPrice(p, sellPrice))}
                {p.sellPrice == null ? " (คิดจากราคาต่อ" + unit + ")" : ""} · ทุน ฿{formatBaht(p.size * costPrice)}
                {p.barcode ? ` · บาร์โค้ด ${p.barcode}` : ""}
              </div>
            </div>
            <button
              type="button"
              aria-label={`ลบหน่วย ${p.name}`}
              disabled={pending}
              onClick={() => remove(p)}
              className="shrink-0 p-1.5 text-danger disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))
      )}

      <div className="flex flex-col gap-3 border-t border-border bg-background px-5 py-4">
        <div className="text-[12.5px] font-semibold text-foreground">เพิ่มหน่วยบรรจุ</div>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            หน่วย
            <select value={name} onChange={(e) => setName(e.target.value)} className={input}>
              {unused.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            1 {name || "หน่วย"} มีกี่{unit}
            <input
              type="number"
              inputMode="numeric"
              min={2}
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="เช่น 24"
              className={input}
            />
          </label>
          <label className={label}>
            ราคาขายต่อ{name || "หน่วย"} (ไม่บังคับ)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={defaultPrice != null ? formatBaht(defaultPrice) : "คิดจากราคาต่อชิ้น"}
              className={input}
            />
          </label>
          <label className={label}>
            บาร์โค้ด{name || "หน่วย"} (ไม่บังคับ)
            <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="ถ้ามี" className={input} />
          </label>
        </div>
        {error && <div className="text-[12px] text-danger">{error}</div>}
        <button
          type="button"
          onClick={add}
          disabled={pending || !name || !(sizeNum > 1)}
          className="rounded-[10px] bg-brand py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
        >
          {pending ? "กำลังบันทึก..." : `เพิ่มหน่วย${name}`}
        </button>
      </div>
    </div>
  );
}
