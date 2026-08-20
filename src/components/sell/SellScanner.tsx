"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarcodeIcon } from "@/components/icons";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
    };
  }
}

const COOLDOWN_MS = 1200;

/** Continuous scan-to-cart: unlike the read-only price-lookup scanner, this keeps the
 * camera running and fires onDetect for every new code, so a cashier can scan several
 * items back-to-back without touching the screen between them. */
export function SellScanner({ onDetect }: { onDetect: (barcode: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);

  const [supported] = useState<boolean>(() => typeof window !== "undefined" && "BarcodeDetector" in window);
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "live" | "denied">("idle");
  const [flash, setFlash] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  const fire = useCallback(
    (code: string) => {
      const last = lastCodeRef.current;
      const now = Date.now();
      if (last && last.code === code && now - last.at < COOLDOWN_MS) return;
      lastCodeRef.current = { code, at: now };
      setFlash(code);
      onDetect(code);
      setTimeout(() => setFlash((f) => (f === code ? null : f)), 700);
    },
    [onDetect]
  );

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState("idle");
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
          if (codes.length > 0) fire(codes[0].rawValue);
        } catch {
          // detection hiccup, keep the loop alive
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraState("denied");
    }
  }, [fire]);

  useEffect(() => stopCamera, [stopCamera]);

  return (
    <div className="flex flex-col gap-3">
      {supported && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-[#141414]">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          {cameraState !== "live" && (
            <div className="absolute inset-0 flex items-center justify-center px-10 text-center text-[12.5px] text-white/70">
              {cameraState === "denied"
                ? "ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้กล้อง หรือกรอกบาร์โค้ดด้วยตนเองด้านล่าง"
                : "กดปุ่มด้านล่างเพื่อเปิดกล้อง แล้วสแกนสินค้าต่อเนื่องได้เลย"}
            </div>
          )}
          {cameraState === "live" && <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-accent/80" />}
          {flash && (
            <div className="absolute inset-x-3 bottom-3 rounded-lg bg-brand/95 px-3 py-2 text-center text-[12.5px] font-semibold text-white">
              เพิ่มลงตะกร้าแล้ว
            </div>
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
          {cameraState === "starting" ? "กำลังเปิดกล้อง..." : "เปิดกล้องสแกนต่อเนื่อง"}
        </button>
      )}
      {supported && cameraState === "live" && (
        <button type="button" onClick={stopCamera} className="rounded-[11px] border border-border py-2.5 text-[13px] font-semibold text-foreground/70">
          ปิดกล้อง
        </button>
      )}

      <div className="rounded-2xl border border-border bg-white p-4">
        <label className="mb-1.5 block text-[12px] font-semibold text-muted">หรือกรอกเลขบาร์โค้ดด้วยตนเอง</label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const code = manualCode.trim();
            if (code) {
              fire(code);
              setManualCode("");
            }
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
          <button type="submit" disabled={!manualCode.trim()} className="rounded-[9px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50">
            เพิ่ม
          </button>
        </form>
      </div>
    </div>
  );
}
