export type PlanId = "trial" | "starter" | "standard" | "premium";

export const PLAN_ORDER: PlanId[] = ["trial", "starter", "standard", "premium"];

export type PlanLimits = { staff: number; branches: number };

const LIMITS: Record<PlanId, PlanLimits> = {
  trial: { staff: 2, branches: 1 },
  starter: { staff: 3, branches: 1 },
  standard: { staff: 10, branches: 3 },
  premium: { staff: Infinity, branches: Infinity },
};

export function planLimits(plan: string): PlanLimits {
  return LIMITS[plan as PlanId] ?? LIMITS.trial;
}

export const PLAN_INFO: Record<PlanId, { label: string; price: number; blurb: string }> = {
  trial: { label: "ทดลองใช้งาน", price: 0, blurb: "ครบทุกฟีเจอร์ 14 วันแรก" },
  starter: { label: "เริ่มต้น", price: 199, blurb: "ร้านเดี่ยว ทีมเล็ก" },
  standard: { label: "Standard", price: 499, blurb: "หลายสาขา ทีมขนาดกลาง" },
  premium: { label: "โปร", price: 999, blurb: "ไม่จำกัดพนักงานและสาขา" },
};
