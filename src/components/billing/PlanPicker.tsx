"use client";

import { useActionState } from "react";
import { changePlanAction, type ActionState } from "@/app/(protected)/billing/actions";
import { PLAN_ORDER, PLAN_INFO, planLimits } from "@/lib/plan";

export function PlanPicker({ currentPlan }: { currentPlan: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(changePlanAction, null);

  return (
    <div>
      {state?.error && <div className="mb-4 rounded-lg bg-danger-light px-3.5 py-2.5 text-[12.5px] text-danger">{state.error}</div>}
      {state?.success && <div className="mb-4 rounded-lg bg-brand-light px-3.5 py-2.5 text-[12.5px] text-brand">เปลี่ยนแพ็กเกจแล้ว</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((plan) => {
          const info = PLAN_INFO[plan];
          const limits = planLimits(plan);
          const isCurrent = plan === currentPlan;
          return (
            <div
              key={plan}
              className={`rounded-2xl border p-4 ${isCurrent ? "border-brand bg-brand-light/40" : "border-border bg-white"}`}
            >
              <div className="mb-1 font-display text-[15px] font-semibold text-foreground">{info.label}</div>
              <div className="mb-2 text-[12px] text-muted">{info.blurb}</div>
              <div className="mb-3 text-[19px] font-bold text-foreground">
                {info.price === 0 ? "ฟรี" : `฿${info.price}`}
                {info.price > 0 && <span className="text-[11px] font-normal text-muted">/เดือน</span>}
              </div>
              <ul className="mb-4 flex flex-col gap-1 text-[12px] text-foreground/80">
                <li>พนักงาน {limits.staff === Infinity ? "ไม่จำกัด" : `สูงสุด ${limits.staff} คน`}</li>
                <li>สาขา {limits.branches === Infinity ? "ไม่จำกัด" : `สูงสุด ${limits.branches} สาขา`}</li>
              </ul>
              {isCurrent ? (
                <div className="rounded-lg bg-brand py-2 text-center text-[12.5px] font-semibold text-white">แพ็กเกจปัจจุบัน</div>
              ) : (
                <form action={formAction}>
                  <input type="hidden" name="plan" value={plan} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-lg border border-brand py-2 text-[12.5px] font-semibold text-brand disabled:opacity-50"
                  >
                    เปลี่ยนเป็นแพ็กเกจนี้
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[11.5px] text-muted">
        หมายเหตุ: ระบบยังไม่เชื่อมต่อผู้ให้บริการชำระเงินจริง การเปลี่ยนแพ็กเกจที่นี่เป็นการสลับสิทธิ์การใช้งานเพื่อทดสอบเท่านั้น
        ไม่มีการเรียกเก็บเงินหรือออกใบแจ้งหนี้จริง
      </p>
    </div>
  );
}
