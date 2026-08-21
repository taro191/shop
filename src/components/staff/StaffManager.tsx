"use client";

import { useActionState, useState } from "react";
import { addStaffAction, setStaffActiveAction, type ActionState } from "@/app/(protected)/staff/actions";
import { PlusIcon } from "@/components/icons";

type Branch = { id: string; name: string };
type StaffRow = {
  id: string;
  name: string;
  phone: string;
  role: "OWNER" | "STAFF";
  active: boolean;
  branchName: string | null;
  isSelf: boolean;
};

export function StaffManager({
  staff,
  branches,
  activeCount,
  limit,
}: {
  staff: StaffRow[];
  branches: Branch[];
  activeCount: number;
  limit: number;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addStaffAction, null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toggleErrors, setToggleErrors] = useState<Record<string, string>>({});

  async function toggle(id: string, next: boolean) {
    setBusyId(id);
    const res = await setStaffActiveAction(id, next);
    setBusyId(null);
    setToggleErrors((prev) => ({ ...prev, [id]: res?.error ?? "" }));
  }

  const atLimit = activeCount >= limit;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12.5px] text-muted">
          {activeCount} / {limit === Infinity ? "ไม่จำกัด" : limit} คน (ใช้งานอยู่)
        </span>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            disabled={atLimit}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4" /> เพิ่มพนักงาน
          </button>
        )}
      </div>

      {atLimit && !showAdd && (
        <div className="mb-4 rounded-lg bg-accent-tint px-3.5 py-2.5 text-[12.5px] text-accent-dark">
          แพ็กเกจปัจจุบันเพิ่มพนักงานได้สูงสุด {limit} คน — <a href="/billing" className="underline">อัปเกรดแพ็กเกจ</a> เพื่อเพิ่มพนักงาน
        </div>
      )}

      {showAdd && (
        <form action={formAction} className="mb-4 rounded-xl border border-border bg-surface-2/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" placeholder="ชื่อพนักงาน" className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input name="phone" placeholder="เบอร์โทรศัพท์ (ใช้ล็อกอิน)" className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input name="password" type="password" placeholder="รหัสผ่านเริ่มต้น (ตั้งให้พนักงาน)" className="rounded-lg border border-border px-3 py-2 text-sm" />
            <select name="role" defaultValue="STAFF" className="rounded-lg border border-border px-3 py-2 text-sm">
              <option value="STAFF">พนักงาน</option>
              <option value="OWNER">เจ้าของร้าน</option>
            </select>
            {branches.length > 1 && (
              <select name="branchId" defaultValue="" className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2">
                <option value="">ทุกสาขา (ไม่ผูกสาขาใดสาขาหนึ่ง)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    ประจำสาขา {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {state?.error && <p className="mt-2 text-[12.5px] text-danger">{state.error}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium">
              ยกเลิก
            </button>
            <button type="submit" disabled={pending} className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
              {pending ? "กำลังบันทึก..." : "เพิ่มพนักงาน"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {staff.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 last:border-none">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-medium text-foreground">{s.name}</span>
                {s.isSelf && <span className="text-[11px] text-muted">(คุณ)</span>}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                    s.role === "OWNER" ? "bg-accent-tint text-accent-dark" : "bg-brand-light text-brand"
                  }`}
                >
                  {s.role === "OWNER" ? "เจ้าของร้าน" : "พนักงาน"}
                </span>
                {!s.active && <span className="rounded-full bg-danger-light px-2 py-0.5 text-[10.5px] font-semibold text-danger">ปิดใช้งาน</span>}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted">
                {s.phone} · {s.branchName ?? "ทุกสาขา"}
              </div>
              {toggleErrors[s.id] && <div className="mt-1 text-[11.5px] text-danger">{toggleErrors[s.id]}</div>}
            </div>
            {!s.isSelf && (
              <button
                type="button"
                onClick={() => toggle(s.id, !s.active)}
                disabled={busyId === s.id}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50 ${
                  s.active ? "border-danger/30 text-danger hover:bg-danger-light" : "border-brand/30 text-brand hover:bg-brand-light"
                }`}
              >
                {busyId === s.id ? "..." : s.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
