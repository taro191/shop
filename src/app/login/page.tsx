"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/actions/auth-actions";
import { ShopIcon } from "@/components/icons";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[380px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent">
            <ShopIcon className="h-5 w-5" stroke="#1F3A28" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
            ร้านชำ<span className="text-accent-dark">ครบวงจร</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-white p-7">
          <h1 className="font-display text-xl font-semibold text-foreground">เข้าสู่ระบบ</h1>
          <p className="mt-1 text-[13px] text-muted">เข้าใช้งานระบบจัดการร้านของคุณ</p>

          <form action={formAction} className="mt-6 flex flex-col gap-4">
            {state?.error && (
              <div className="rounded-lg bg-danger-light px-3.5 py-2.5 text-[12.5px] text-danger">{state.error}</div>
            )}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">เบอร์โทรศัพท์</label>
              <input
                name="phone"
                type="tel"
                placeholder="08X-XXX-XXXX"
                required
                className="w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">รหัสผ่าน</label>
              <input
                name="password"
                type="password"
                placeholder="รหัสผ่านของคุณ"
                required
                className="w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none focus:border-brand"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-[10px] bg-accent py-3 text-[14.5px] font-bold text-[#1F3A28] transition-opacity disabled:opacity-60"
            >
              {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="mt-5 rounded-lg bg-background px-3.5 py-2.5 text-center text-[11.5px] text-muted">
            บัญชีทดลอง: 0812345678 / password123
          </p>
        </div>

        <p className="mt-5 text-center text-[13px] text-muted">
          ยังไม่มีบัญชี?{" "}
          <Link href="/#signup" className="font-semibold text-accent-dark">
            สมัครใช้งานฟรี
          </Link>
        </p>
      </div>
    </div>
  );
}
