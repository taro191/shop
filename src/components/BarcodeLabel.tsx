"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function BarcodeLabel({
  name,
  price,
  unit,
  barcode,
  storeName,
}: {
  name: string;
  price: number;
  unit: string;
  barcode: string | null;
  storeName: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcode && svgRef.current) {
      const format = barcode.length === 13 ? "EAN13" : barcode.length === 8 ? "EAN8" : "CODE128";
      try {
        JsBarcode(svgRef.current, barcode, { format, width: 1.4, height: 34, fontSize: 11, margin: 0 });
      } catch {
        // Bad EAN check digit (common with hand-entered SKUs) — fall back to CODE128, which
        // accepts any digit string, so the label still gets a scannable barcode.
        try {
          JsBarcode(svgRef.current, barcode, { format: "CODE128", width: 1.4, height: 34, fontSize: 11, margin: 0 });
        } catch {
          // Truly unrenderable — leave blank.
        }
      }
    }
  }, [barcode]);

  return (
    <div className="flex w-[190px] flex-col items-center gap-0.5 border border-dashed border-border p-2 text-center break-inside-avoid">
      <div className="w-full truncate text-[10.5px] font-medium text-foreground">{storeName}</div>
      <div className="w-full truncate text-[11.5px] font-semibold text-foreground">{name}</div>
      <div className="font-display text-[17px] font-bold text-foreground">
        ฿{price}
        <span className="text-[10px] font-normal text-muted"> /{unit}</span>
      </div>
      {barcode ? <svg ref={svgRef} /> : <div className="py-2 text-[10px] text-muted">ไม่มีบาร์โค้ด</div>}
    </div>
  );
}
