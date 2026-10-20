"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogAddButton } from "@/components/catalog/CatalogAddButton";
import type { AddedProduct } from "@/app/(protected)/catalog/actions";

type OnlineSource = { label: string; url: string };
type CatalogItem = { id: string; name: string; brand: string | null; unit: string; size: string | null; barcode: string | null };

/** Shown when a store search finds nothing: looks the query (name or barcode) up in the
 * shared catalog and lets the user pull a match into the store on the spot. Without
 * `onAdded` the current page is refreshed so the new product shows up in its results. */
export function CatalogFallback({ q, onAdded }: { q: string; onAdded?: (product: AddedProduct) => void }) {
  const router = useRouter();
  const [result, setResult] = useState<{ q: string; items: CatalogItem[]; total: number; online: OnlineSource | null } | null>(null);
  const query = q.trim();
  const isBarcode = /^\d{8,14}$/.test(query);

  useEffect(() => {
    if (query.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!cancelled) setResult({ q: query, items: data.items ?? [], total: data.total ?? 0, online: data.online ?? null });
      } catch {
        if (!cancelled) setResult({ q: query, items: [], total: 0, online: null });
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  if (query.length < 2) return null;
  if (!result || result.q !== query) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white px-4 py-3 text-[12.5px] text-muted">
        {isBarcode ? "กำลังค้นหาในคลังสินค้ากลางและอินเทอร์เน็ต..." : "กำลังค้นหาในคลังสินค้ากลาง..."}
      </div>
    );
  }

  if (result.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white px-4 py-3 text-[12.5px] text-muted">
        ไม่พบ &ldquo;{query}&rdquo; ทั้งในร้าน คลังสินค้ากลาง{isBarcode ? " และอินเทอร์เน็ต" : ""} —{" "}
        <Link href={`/inventory?new=${encodeURIComponent(query)}`} className="font-semibold text-brand underline">
          เพิ่มเป็นสินค้าใหม่
        </Link>
      </div>
    );
  }

  const handleAdded = (product: AddedProduct) => {
    if (onAdded) onAdded(product);
    else router.refresh();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-brand/40 bg-white">
      <div className="border-b border-border bg-brand-light px-4 py-2.5 text-[12.5px] font-semibold text-brand">
        {result.online ? (
          <>
            ไม่มีในร้านและคลังกลาง — พบจากอินเทอร์เน็ต (
            <a href={result.online.url} target="_blank" rel="noreferrer" className="underline">
              {result.online.label}
            </a>
            ) ตรวจชื่อกับสินค้าจริงก่อนเพิ่มเข้าร้าน
          </>
        ) : (
          <>ไม่มีในร้าน — พบในคลังสินค้ากลาง กด &ldquo;เพิ่มเข้าร้าน&rdquo; เพื่อดึงเข้าร้านได้เลย</>
        )}
      </div>
      {result.items.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 border-t border-border px-4 py-3 first:border-none">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-foreground">{item.name}</div>
            <div className="text-[11.5px] text-muted">
              {[item.brand, `หน่วย${item.unit}`, item.barcode].filter(Boolean).join(" · ")}
            </div>
          </div>
          <CatalogAddButton catalogId={item.id} unit={item.unit} defaultOpen={result.items.length === 1} onAdded={handleAdded} />
        </div>
      ))}
      {result.total > result.items.length && (
        <Link
          href={`/catalog?q=${encodeURIComponent(query)}`}
          className="block border-t border-border px-4 py-2.5 text-center text-[12px] font-semibold text-brand"
        >
          ดูทั้งหมดในคลังสินค้ากลาง ({result.total})
        </Link>
      )}
    </div>
  );
}
