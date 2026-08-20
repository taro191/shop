"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function PromptPayQR({ payload, size = 220 }: { payload: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [lastKey, setLastKey] = useState("");

  // Reset synchronously during render when the payload/size changes (so the loading
  // skeleton shows immediately) — the effect below only performs the async QR render.
  const key = `${payload}|${size}`;
  if (key !== lastKey) {
    setLastKey(key);
    setSrc(null);
    setError(false);
  }

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, { width: size, margin: 1, color: { dark: "#1F3A28", light: "#FFFFFF" } })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [payload, size]);

  if (error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-xl bg-danger-light text-center text-[12px] text-danger"
      >
        สร้าง QR ไม่สำเร็จ
      </div>
    );
  }

  if (!src) {
    return <div style={{ width: size, height: size }} className="animate-pulse rounded-xl bg-background" />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="PromptPay QR" width={size} height={size} className="rounded-xl" />;
}
