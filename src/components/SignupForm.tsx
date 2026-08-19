"use client";

import { useActionState } from "react";
import { signupAction, type ActionState } from "@/app/actions/auth-actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(signupAction, null);

  return (
    <div className="rounded-2xl border border-border bg-white p-7 sm:p-8">
      {state?.error && (
        <div className="mb-4 rounded-lg bg-danger-light px-3.5 py-2.5 text-[12.5px] text-danger">{state.error}</div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <Field label="ชื่อร้านค้า" name="storeName" placeholder="เช่น ร้านสมชายพาณิชย์" />
        <Field label="ชื่อเจ้าของร้าน" name="ownerName" placeholder="ชื่อ-นามสกุล" />
        <Field label="เบอร์โทรศัพท์" name="phone" type="tel" placeholder="08X-XXX-XXXX" />
        <Field label="ตั้งรหัสผ่าน" name="password" type="password" placeholder="อย่างน้อย 8 ตัวอักษร" />
        <button
          type="submit"
          disabled={pending}
          className="mt-1.5 rounded-[10px] bg-accent py-3.5 text-[14.5px] font-bold text-[#1F3A28] transition-opacity disabled:opacity-60"
        >
          {pending ? "กำลังสมัคร..." : "สมัครใช้งานฟรี 14 วัน"}
        </button>
        <p className="text-center text-xs text-muted">
          การสมัครถือว่ายอมรับข้อกำหนดการใช้งานของเรา
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}
