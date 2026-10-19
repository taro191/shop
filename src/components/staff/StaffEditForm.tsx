"use client";

import { useActionState, useEffect } from "react";
import { updateStaffAction, type ActionState } from "@/app/(protected)/staff/actions";
import { PasswordInput } from "@/components/ui/PasswordInput";

type Branch = { id: string; name: string };
export type EditableStaff = {
  id: string;
  name: string;
  phone: string;
  role: "OWNER" | "STAFF";
  branchId: string | null;
  isSelf: boolean;
};

const input = "w-full rounded-lg border border-border px-3 py-2 text-sm";
const label = "text-[11.5px] font-semibold text-muted";

/** Inline form for the owner to edit one staff account. */
export function StaffEditForm({ staff, branches, onDone }: { staff: EditableStaff; branches: Branch[]; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateStaffAction, null);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-border bg-background px-4 py-4">
      <input type="hidden" name="userId" value={staff.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          ชื่อ
          <input name="name" defaultValue={staff.name} required className={`mt-1 font-normal ${input}`} />
        </label>
        <label className={label}>
          เบอร์โทรศัพท์ (ใช้ล็อกอิน)
          <input name="phone" type="tel" defaultValue={staff.phone} required className={`mt-1 font-normal ${input}`} />
        </label>
        <label className={label}>
          สิทธิ์
          {staff.isSelf ? (
            <>
              <input type="hidden" name="role" value={staff.role} />
              <div className="mt-1 py-2 text-sm font-normal text-foreground/70">เจ้าของร้าน (เปลี่ยนสิทธิ์ตัวเองไม่ได้)</div>
            </>
          ) : (
            <select name="role" defaultValue={staff.role} className={`mt-1 font-normal ${input}`}>
              <option value="STAFF">พนักงาน</option>
              <option value="OWNER">เจ้าของร้าน</option>
            </select>
          )}
        </label>
        {branches.length > 1 ? (
          <label className={label}>
            สาขา
            <select name="branchId" defaultValue={staff.branchId ?? ""} className={`mt-1 font-normal ${input}`}>
              <option value="">ทุกสาขา</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="branchId" value={staff.branchId ?? ""} />
        )}
        <label className={`${label} sm:col-span-2`}>
          ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)
          <div className="mt-1 font-normal">
            <PasswordInput name="newPassword" autoComplete="new-password" placeholder="อย่างน้อย 8 ตัวอักษร" className={input} />
          </div>
        </label>
      </div>
      {state?.error && <p className="text-[12.5px] text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium">
          ยกเลิก
        </button>
        <button type="submit" disabled={pending} className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
          {pending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </button>
      </div>
    </form>
  );
}
