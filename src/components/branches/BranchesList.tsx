"use client";

import { useActionState, useState } from "react";
import { addBranchAction, removeBranchAction, type ActionState } from "@/app/(protected)/branches/actions";
import { PlusIcon, TrashIcon } from "@/components/icons";

type Branch = { id: string; name: string; address: string | null; isMain: boolean; staffCount: number };

export function BranchesList({ branches, atLimit, limit }: { branches: Branch[]; atLimit: boolean; limit: number }) {
  const [showAdd, setShowAdd] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addBranchAction, null);
  const [removeError, setRemoveError] = useState<Record<string, string>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setRemovingId(id);
    const res = await removeBranchAction(id);
    setRemovingId(null);
    if (res?.error) setRemoveError((prev) => ({ ...prev, [id]: res.error! }));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12.5px] text-muted">
          {branches.length} / {limit === Infinity ? "ไม่จำกัด" : limit} สาขา
        </span>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            disabled={atLimit}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4" /> เพิ่มสาขา
          </button>
        )}
      </div>

      {atLimit && !showAdd && (
        <div className="mb-4 rounded-lg bg-accent-tint px-3.5 py-2.5 text-[12.5px] text-accent-dark">
          แพ็กเกจปัจจุบันเปิดได้สูงสุด {limit} สาขา — <a href="/billing" className="underline">อัปเกรดแพ็กเกจ</a> เพื่อเปิดสาขาเพิ่ม
        </div>
      )}

      {showAdd && (
        <form action={formAction} className="mb-4 rounded-xl border border-border bg-surface-2/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" placeholder="ชื่อสาขา เช่น สาขา 2" className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input name="address" placeholder="ที่อยู่ (ถ้ามี)" className="rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          {state?.error && <p className="mt-2 text-[12.5px] text-danger">{state.error}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium">
              ยกเลิก
            </button>
            <button type="submit" disabled={pending} className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
              {pending ? "กำลังบันทึก..." : "บันทึกสาขา"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {branches.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 last:border-none">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-medium text-foreground">{b.name}</span>
                {b.isMain && <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10.5px] font-semibold text-brand">สาขาหลัก</span>}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted">
                {b.address || "ไม่ระบุที่อยู่"} · พนักงาน {b.staffCount} คน
              </div>
              {removeError[b.id] && <div className="mt-1 text-[11.5px] text-danger">{removeError[b.id]}</div>}
            </div>
            {!b.isMain && (
              <button
                type="button"
                onClick={() => handleRemove(b.id)}
                disabled={removingId === b.id}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-danger hover:bg-danger-light disabled:opacity-50"
                aria-label="ปิดสาขา"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
