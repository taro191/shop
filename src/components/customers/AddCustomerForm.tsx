"use client";

import { useState, useTransition } from "react";
import { addCustomer } from "@/app/(protected)/customers/actions";

type Customer = { id: string; name: string; phone: string; points: number };

export function AddCustomerForm({
  initialPhone = "",
  onCreated,
  onCancel,
}: {
  initialPhone?: string;
  onCreated: (customer: Customer) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await addCustomer({ name, phone });
      if (result.ok) onCreated(result.customer);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[10px] border border-border p-3">
      {error && <div className="rounded-lg bg-danger-light px-3 py-2 text-[11.5px] text-danger">{error}</div>}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ชื่อลูกค้า"
        className="w-full rounded-[8px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="เบอร์โทรศัพท์"
        inputMode="numeric"
        className="w-full rounded-[8px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand"
      />
      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-[8px] border border-border py-2 text-[12.5px] font-semibold text-foreground/70">
            ยกเลิก
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex-1 rounded-[8px] bg-brand py-2 text-[12.5px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "เพิ่มลูกค้า"}
        </button>
      </div>
    </div>
  );
}
