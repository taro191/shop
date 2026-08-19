"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarcodeIcon } from "@/components/icons";

type LookupResult = {
  found: boolean;
  product?: {
    id: string;
    name: string;
    unit: string;
    sellPrice: number;
    barcode: string | null;
    quantity: number;
    statusText: string;
    statusClassName: string;
  };
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
    };
  }
}

export function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [supported] = useState<boolean>(() => typeof window !== "undefined" && "BarcodeDetector" in window);
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "live" | "denied" | "error">("idle");
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState("idle");
  }, []);

  const lookup = useCallback(async (code: string) => {
    setLoading(true);
    setScannedCode(code);
    try {
      const res = await fetch(`/api/products/lookup?barcode=${encodeURIComponent(code)}`);
      const data: LookupResult = await res.json();
      setResult(data);
    } catch {
      setResult({ found: false });
    } finally {
      setLoading(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!window.BarcodeDetector) return;
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("live");

      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      });

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            stopCamera();
            void lookup(codes[0].rawValue);
            return;
          }
        } catch {
          // detection hiccup, keep trying
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraState("denied");
    }
  }, [lookup, stopCamera]);

  useEffect(() => stopCamera, [stopCamera]);

  const reset = () => {
    setResult(null);
    setScannedCode(null);
    setManualCode("");
  };

  if (result) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        {result.found && result.product ? (
          <>
            <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-full bg-brand-light">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="mb-1.5 text-[11.5px] text-muted">พบสินค้าจากบาร์โค้ด {result.product.barcode}</div>
            <div className="mb-3.5 font-display text-[17px] font-semibold text-foreground">{result.product.name}</div>
            <div className="font-display text-[38px] font-bold text-foreground">฿{result.product.sellPrice}</div>
            <div className="mb-4 mt-1.5 text-xs text-muted">ราคาขายหน้าร้าน · หน่วยละ{result.product.unit}</div>
            <div className={`mb-5 inline-block rounded-lg px-3 py-1.5 text-[11.5px] font-semibold ${result.product.statusClassName}`}>
              {result.product.statusText}
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-full bg-danger-light">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <div className="mb-1.5 font-display text-[16px] font-semibold text-foreground">ไม่พบสินค้า</div>
            <div className="mb-5 text-[12.5px] text-muted">ไม่พบสินค้าที่ใช้บาร์โค้ด {scannedCode} ในระบบ</div>
          </>
        )}
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-[11px] border border-border py-3 text-[13.5px] font-semibold text-foreground/75"
        >
          สแกนใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {supported && (
        <div className="relative aspect-square w-full overflow-hidden rounded-[18px] bg-[#141414]">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          {cameraState !== "live" && (
            <div className="absolute inset-0 flex items-center justify-center px-10 text-center text-[12.5px] text-white/70">
              {cameraState === "denied"
                ? "ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้กล้อง หรือกรอกบาร์โค้ดด้วยตนเองด้านล่าง"
                : "กดปุ่มด้านล่างเพื่อเปิดกล้องสแกนบาร์โค้ด"}
            </div>
          )}
          {cameraState === "live" && (
            <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-accent/80" />
          )}
        </div>
      )}

      {supported === false && (
        <div className="rounded-xl bg-accent-light px-4 py-3 text-[12.5px] text-accent-dark">
          เบราว์เซอร์นี้ยังไม่รองรับการสแกนบาร์โค้ดจากกล้องโดยตรง กรุณากรอกเลขบาร์โค้ดด้วยตนเองด้านล่าง
        </div>
      )}

      {supported && cameraState !== "live" && (
        <button
          type="button"
          onClick={startCamera}
          disabled={cameraState === "starting"}
          className="flex items-center justify-center gap-2.5 rounded-[13px] bg-accent py-3.5 text-[14px] font-bold text-[#1F3A28] disabled:opacity-60"
        >
          <BarcodeIcon className="h-[19px] w-[19px]" strokeWidth={2} />
          {cameraState === "starting" ? "กำลังเปิดกล้อง..." : "เปิดกล้องสแกนบาร์โค้ด"}
        </button>
      )}

      <div className="rounded-2xl border border-border bg-white p-4">
        <label className="mb-1.5 block text-[12px] font-semibold text-muted">หรือกรอกเลขบาร์โค้ดด้วยตนเอง</label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) void lookup(manualCode.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            inputMode="numeric"
            placeholder="เช่น 8850001234017"
            className="min-w-0 flex-grow rounded-[9px] border border-border px-3.5 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={loading || !manualCode.trim()}
            className="rounded-[9px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            ค้นหา
          </button>
        </form>
      </div>
    </div>
  );
}
