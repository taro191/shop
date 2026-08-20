"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { checkoutSale, type CheckoutResult } from "@/app/(protected)/sell/actions";
import { SellScanner } from "@/components/sell/SellScanner";
import { PromptPayQR } from "@/components/PromptPayQR";
import { buildPromptPayPayload } from "@/lib/promptpay";
import { CartIcon, PlusIcon, MinusIcon, TrashIcon, CheckCircleIcon } from "@/components/icons";
import { formatBaht, formatThaiTime, formatThaiDate } from "@/lib/format";
import { productStockStatus } from "@/lib/status";

type ProductRow = {
  id: string;
  name: string;
  unit: string;
  category: string;
  sellPrice: number;
  quantity: number;
  barcode: string | null;
};

type CartLine = { productId: string; name: string; unit: string; sellPrice: number; stock: number; qty: number };
type Receipt = Extract<CheckoutResult, { ok: true }>["receipt"];

export function SellCart({
  products,
  storeName,
  promptPayId,
}: {
  products: ProductRow[];
  storeName: string;
  promptPayId: string | null;
}) {
  const [mode, setMode] = useState<"type" | "scan">("type");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Map<string, CartLine>>(new Map());
  const [method, setMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [showQr, setShowQr] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pending, startTransition] = useTransition();

  const byBarcode = useMemo(() => {
    const map = new Map<string, ProductRow>();
    for (const p of products) if (p.barcode) map.set(p.barcode, p);
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 30);
  }, [products, query]);

  const cartLines = useMemo(() => [...cart.values()], [cart]);
  const totalQty = cartLines.reduce((s, l) => s + l.qty, 0);
  const totalAmount = cartLines.reduce((s, l) => s + l.qty * l.sellPrice, 0);

  const qrPayload = useMemo(() => {
    if (!promptPayId || totalAmount <= 0) return null;
    try {
      return buildPromptPayPayload(promptPayId, totalAmount);
    } catch {
      return null;
    }
  }, [promptPayId, totalAmount]);

  function addToCart(product: ProductRow, qty = 1) {
    setError(null);
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      next.set(product.id, {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        sellPrice: product.sellPrice,
        stock: product.quantity,
        qty: (existing?.qty ?? 0) + qty,
      });
      return next;
    });
  }

  function setLineQty(productId: string, qty: number) {
    setCart((prev) => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(productId);
      } else {
        const existing = next.get(productId);
        if (existing) next.set(productId, { ...existing, qty });
      }
      return next;
    });
  }

  function handleScan(barcode: string) {
    const product = byBarcode.get(barcode);
    if (!product) {
      setScanNotice(`ไม่พบสินค้าที่บาร์โค้ด ${barcode} ในระบบ`);
      setTimeout(() => setScanNotice((n) => (n?.includes(barcode) ? null : n)), 2500);
      return;
    }
    addToCart(product);
    setScanNotice(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`);
    setTimeout(() => setScanNotice((n) => (n?.includes(product.name) ? null : n)), 2000);
  }

  function requestCheckout() {
    if (cartLines.length === 0) return;
    if (method === "TRANSFER" && qrPayload) {
      setShowQr(true);
      return;
    }
    submitSale();
  }

  function submitSale() {
    if (cartLines.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await checkoutSale({
        items: cartLines.map((l) => ({ productId: l.productId, quantity: l.qty })),
        method,
      });
      if (result.ok) {
        setReceipt(result.receipt);
        setCart(new Map());
        setShowQr(false);
      } else {
        setError(result.error);
        setShowQr(false);
      }
    });
  }

  function newSale() {
    setReceipt(null);
    setError(null);
  }

  if (receipt) {
    return (
      <div className="mx-auto max-w-[480px] px-5 pb-10 pt-4 sm:px-8">
        <div id="receipt-print" className="rounded-2xl border border-border bg-white p-6 text-center">
          <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand print:hidden">
            <CheckCircleIcon className="h-7 w-7" strokeWidth={2} />
          </div>
          <div className="hidden font-display text-base font-semibold text-foreground print:block">{storeName}</div>
          <div className="mb-1 font-display text-lg font-semibold text-foreground">ใบเสร็จรับเงิน</div>
          <div className="mb-5 text-[12.5px] text-muted">
            {formatThaiDate(new Date(receipt.soldAt))} · {formatThaiTime(new Date(receipt.soldAt))} · เลขที่ {receipt.id.slice(-8).toUpperCase()}
          </div>

          <div className="mb-5 flex flex-col gap-2 rounded-xl bg-background p-4 text-left print:rounded-none print:bg-white print:border-t print:border-b print:border-dashed print:border-foreground/40 print:py-3">
            {receipt.lines.map((l, i) => (
              <div key={i} className="flex justify-between text-[13px]">
                <span className="text-foreground/80">
                  {l.name} × {l.quantity} {l.unit}
                </span>
                <span className="font-medium text-foreground">฿{formatBaht(l.subtotal)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-border pt-2 text-[14px] font-semibold text-foreground">
              <span>รวม</span>
              <span>฿{formatBaht(receipt.amount)}</span>
            </div>
            <div className="text-[11.5px] text-muted">ชำระโดย {receipt.method === "CASH" ? "เงินสด" : "เงินโอน / QR"}</div>
          </div>

          <div className="flex gap-2.5 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 rounded-[11px] border border-border py-3 text-[13.5px] font-semibold text-foreground/75"
            >
              พิมพ์ใบเสร็จ
            </button>
            <button type="button" onClick={newSale} className="flex-1 rounded-[11px] bg-brand py-3 text-[14px] font-semibold text-white">
              ขายรายการใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-28 pt-4 sm:px-8 lg:pb-10">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* Product browsing */}
        <div>
          <div className="mb-4 flex rounded-[11px] bg-[oklch(0.94_0.004_90)] p-[3px]">
            <button
              type="button"
              onClick={() => setMode("type")}
              className={`flex-1 rounded-[9px] py-2.5 text-center text-[13px] font-semibold ${mode === "type" ? "bg-white text-brand shadow-sm" : "text-muted"}`}
            >
              พิมพ์ค้นหา
            </button>
            <button
              type="button"
              onClick={() => setMode("scan")}
              className={`flex-1 rounded-[9px] py-2.5 text-center text-[13px] font-semibold ${mode === "scan" ? "bg-white text-brand shadow-sm" : "text-muted"}`}
            >
              สแกนต่อเนื่อง
            </button>
          </div>

          {mode === "type" ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-[12px] border border-border bg-white px-3.5 py-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="พิมพ์ชื่อสินค้าที่จะขาย..."
                  className="w-full min-w-0 bg-transparent text-sm outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                {filtered.map((p) => {
                  const status = productStockStatus(p.quantity);
                  const inCart = cart.get(p.id)?.qty ?? 0;
                  const disabled = p.quantity <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => addToCart(p)}
                      className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-white px-4 py-3 text-left disabled:opacity-50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-medium text-foreground">{p.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted">
                          <span>฿{formatBaht(p.sellPrice)} / {p.unit}</span>
                          <span className={`rounded px-1.5 py-0.5 font-semibold ${status.className}`}>{status.text}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {inCart > 0 && <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11.5px] font-semibold text-brand">×{inCart}</span>}
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
                          <PlusIcon className="h-4 w-4" strokeWidth={2.3} />
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && <div className="py-10 text-center text-[13px] text-muted">ไม่พบสินค้า</div>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {scanNotice && (
                <div className="rounded-lg bg-brand-light px-3.5 py-2.5 text-center text-[12.5px] font-medium text-brand">{scanNotice}</div>
              )}
              <SellScanner onDetect={handleScan} />
            </div>
          )}
        </div>

        {/* Cart */}
        <div id="cart" className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="font-display text-[15px] font-semibold text-foreground">ตะกร้าขาย</span>
              {totalQty > 0 && <span className="text-[12px] text-muted">{totalQty} ชิ้น</span>}
            </div>

            {cartLines.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-muted">ยังไม่มีสินค้าในตะกร้า</div>
            ) : (
              <div className="flex flex-col gap-3">
                {cartLines.map((l) => (
                  <div key={l.productId} className="flex items-center gap-2.5">
                    <div className="min-w-0 flex-grow">
                      <div className="truncate text-[13px] font-medium text-foreground">{l.name}</div>
                      <div className="text-[11.5px] text-muted">฿{formatBaht(l.sellPrice)} / {l.unit}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" onClick={() => setLineQty(l.productId, l.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground/70">
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-[13px] font-medium tabular-nums">{l.qty}</span>
                      <button type="button" onClick={() => setLineQty(l.productId, l.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground/70">
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="w-16 shrink-0 text-right text-[13px] font-semibold text-foreground">฿{formatBaht(l.qty * l.sellPrice)}</span>
                    <button type="button" onClick={() => setLineQty(l.productId, 0)} className="shrink-0 text-danger">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showQr && qrPayload ? (
              <div className="mt-4 border-t border-border pt-4 text-center">
                <div className="mb-3 text-[13px] font-semibold text-foreground">ให้ลูกค้าสแกนจ่าย ฿{formatBaht(totalAmount)}</div>
                <div className="mb-3 flex justify-center">
                  <PromptPayQR payload={qrPayload} size={200} />
                </div>
                <div className="mb-4 text-[11.5px] text-muted">QR นี้ไม่ยืนยันยอดอัตโนมัติ กดปุ่มด้านล่างหลังลูกค้าโอนแล้วเท่านั้น</div>
                {error && <div className="mb-3 rounded-lg bg-danger-light px-3.5 py-2.5 text-[12.5px] text-danger">{error}</div>}
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowQr(false)}
                    className="flex-1 rounded-[11px] border border-border py-3 text-[13.5px] font-semibold text-foreground/70"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    onClick={submitSale}
                    disabled={pending}
                    className="flex-1 rounded-[11px] bg-brand py-3 text-[13.5px] font-semibold text-white disabled:opacity-50"
                  >
                    {pending ? "กำลังบันทึก..." : "ลูกค้าชำระแล้ว"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 border-t border-border pt-4">
                <div className="mb-3 flex items-center justify-between text-[15px] font-semibold text-foreground">
                  <span>ยอดรวม</span>
                  <span>฿{formatBaht(totalAmount)}</span>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("CASH")}
                    className={`rounded-[9px] border py-2.5 text-[13px] font-medium ${method === "CASH" ? "border-brand bg-brand-light text-brand" : "border-border text-foreground/70"}`}
                  >
                    เงินสด
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("TRANSFER")}
                    className={`rounded-[9px] border py-2.5 text-[13px] font-medium ${method === "TRANSFER" ? "border-accent bg-accent-light text-accent-dark" : "border-border text-foreground/70"}`}
                  >
                    เงินโอน / QR
                  </button>
                </div>

                {method === "TRANSFER" && !qrPayload && (
                  <div className="mb-3 rounded-lg bg-accent-light px-3.5 py-2.5 text-[12px] text-accent-dark">
                    ยังไม่ได้ตั้งค่าพร้อมเพย์ของร้าน{" "}
                    <Link href="/settings" className="font-semibold underline">
                      ไปตั้งค่า
                    </Link>{" "}
                    เพื่อแสดง QR ให้ลูกค้าสแกน
                  </div>
                )}

                {error && <div className="mb-3 rounded-lg bg-danger-light px-3.5 py-2.5 text-[12.5px] text-danger">{error}</div>}

                <button
                  type="button"
                  onClick={requestCheckout}
                  disabled={cartLines.length === 0 || pending}
                  className="w-full rounded-[11px] bg-brand py-3 text-[14px] font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "กำลังบันทึก..." : method === "TRANSFER" && qrPayload ? "แสดง QR รับเงิน" : "ยืนยันการขาย"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile floating cart bar */}
      {cartLines.length > 0 && !showQr && (
        <Link
          href="#cart"
          className="fixed inset-x-4 bottom-[86px] z-10 flex items-center justify-between rounded-[13px] bg-brand-dark px-4 py-3.5 text-white shadow-[0_8px_24px_rgba(20,30,20,0.25)] lg:hidden"
        >
          <span className="flex items-center gap-2 text-[13.5px] font-semibold">
            <CartIcon className="h-[18px] w-[18px]" />
            {totalQty} ชิ้น
          </span>
          <span className="text-[14.5px] font-bold">฿{formatBaht(totalAmount)}</span>
        </Link>
      )}
    </div>
  );
}
