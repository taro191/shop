"use client";

import { useState } from "react";
import { sendLowStockAlert } from "@/app/(protected)/dashboard/actions";

export function NotifyButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleClick() {
    setPending(true);
    setMessage(null);
    const res = await sendLowStockAlert();
    setPending(false);
    setMessage(res.success ? { text: "ส่งแจ้งเตือนแล้ว", ok: true } : { text: res.error ?? "ส่งไม่สำเร็จ", ok: false });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-[11.5px] font-semibold text-accent-dark disabled:opacity-50"
      >
        {pending ? "กำลังส่ง..." : "ส่งแจ้งเตือน"}
      </button>
      {message && <span className={`text-[10.5px] ${message.ok ? "text-brand" : "text-danger"}`}>{message.text}</span>}
    </div>
  );
}
