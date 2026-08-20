"use client";

import { useActionState } from "react";
import { updateStoreSettings, type ActionState } from "@/app/(protected)/settings/actions";

export function SettingsForm({ storeName, promptPayId }: { storeName: string; promptPayId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateStoreSettings, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
      {state?.error && <div className="rounded-lg bg-danger-light px-3.5 py-2.5 text-[12.5px] text-danger">{state.error}</div>}
      {state?.success && <div className="rounded-lg bg-brand-light px-3.5 py-2.5 text-[12.5px] text-brand">บันทึกการตั้งค่าแล้ว</div>}

      <div>
        <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">ชื่อร้านค้า</label>
        <input
          name="name"
          type="text"
          defaultValue={storeName}
          required
          className="w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none focus:border-brand"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">เบอร์พร้อมเพย์ หรือเลขบัตรประชาชน (สำหรับ QR รับเงิน)</label>
        <input
          name="promptPayId"
          type="text"
          defaultValue={promptPayId}
          placeholder="เช่น 0812345678 หรือ 1234567890123"
          inputMode="numeric"
          className="w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none focus:border-brand"
        />
        <p className="mt-1.5 text-[11.5px] text-muted">
          ใช้แสดง QR ให้ลูกค้าสแกนโอนเงินตอนขายสินค้า เป็น QR แบบคงที่ ระบบตรวจสอบยอดชำระอัตโนมัติไม่ได้ พนักงานต้องกดยืนยันเองว่าลูกค้าโอนแล้ว
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-[10px] bg-brand py-3 text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </button>
    </form>
  );
}
