"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeIcon } from "@/components/icons";
import { canUseCamera, createBarcodeReader } from "@/lib/barcode-detector";


/** Camera button for a search box: scans one barcode, then navigates to `action`
 * with `q=<barcode>` (plus `params`) — the same URL the search form would submit. */
export function ScanSearchButton({ action, params }: { action: string; params?: Record<string, string | undefined> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const onDetect = useCallback(
    (code: string) => {
      setOpen(false);
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params ?? {})) if (v) qs.set(k, v);
      qs.set("q", code);
      router.push(`${action}?${qs.toString()}`);
    },
    [action, params, router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="สแกนบาร์โค้ดด้วยกล้อง"
        className="-my-1 -mr-1.5 flex shrink-0 items-center gap-1 rounded-[8px] bg-brand-light px-2.5 py-1.5 text-[12px] font-semibold text-brand"
      >
        <BarcodeIcon className="h-4 w-4" />
        สแกน
      </button>
      {open && <CameraScanModal onDetect={onDetect} onClose={() => setOpen(false)} />}
    </>
  );
}

function CameraScanModal({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"starting" | "live" | "denied" | "unsupported">(() =>
    canUseCamera() ? "starting" : "unsupported",
  );

  useEffect(() => {
    if (state !== "starting") return;
    let stream: MediaStream | null = null;
    let raf: number | null = null;
    let stopped = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setState("live");
        const detector = await createBarcodeReader();
        const tick = async () => {
          if (stopped) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2) {
            try {
              const codes = await detector.detect(video);
              if (codes.length > 0 && !stopped) {
                onDetect(codes[0].rawValue);
                return;
              }
            } catch {
              // detection hiccup, keep trying
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!stopped) setState("denied");
      }
    })();

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // Start the camera once per modal open; onDetect changes don't restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4" role="dialog" aria-label="สแกนบาร์โค้ด">
      <div className="mb-3 flex items-center justify-between text-white">
        <span className="text-[14px] font-semibold">สแกนบาร์โค้ด</span>
        <button type="button" onClick={onClose} className="rounded-[8px] border border-white/30 px-3 py-1.5 text-[13px]">
          ปิด
        </button>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-[18px] bg-[#141414]">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        {state === "live" ? (
          <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-accent/80" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-[13px] leading-relaxed text-white/75">
            {state === "starting" && "กำลังเปิดกล้อง..."}
            {state === "denied" && "ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์"}
            {state === "unsupported" &&
              "เบราว์เซอร์นี้เปิดกล้องไม่ได้ กรุณาพิมพ์เลขบาร์โค้ดแทน"}
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-[12px] text-white/60">เล็งบาร์โค้ดให้อยู่ในกรอบ ระบบจะค้นหาให้อัตโนมัติ</p>
    </div>
  );
}
