import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlanPicker } from "@/components/billing/PlanPicker";
import { planLimits } from "@/lib/plan";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "OWNER") redirect("/dashboard");

  const [activeStaff, branchCount] = await Promise.all([
    prisma.user.count({ where: { storeId: user.storeId, active: true } }),
    prisma.branch.count({ where: { storeId: user.storeId } }),
  ]);
  const limits = planLimits(user.store.plan);

  return (
    <div className="mx-auto max-w-[900px] pb-10">
      <PageHeader title="แพ็กเกจและการเรียกเก็บเงิน" subtitle="ดูสิทธิ์การใช้งานปัจจุบันและเปลี่ยนแพ็กเกจ" />
      <div className="px-5 pt-4 sm:px-8">
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-[12px] text-muted">พนักงานที่ใช้งานอยู่</div>
            <div className="mt-1 font-display text-[20px] font-bold text-foreground">
              {activeStaff} <span className="text-[13px] font-normal text-muted">/ {limits.staff === Infinity ? "ไม่จำกัด" : limits.staff}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-[12px] text-muted">สาขาที่เปิดอยู่</div>
            <div className="mt-1 font-display text-[20px] font-bold text-foreground">
              {branchCount} <span className="text-[13px] font-normal text-muted">/ {limits.branches === Infinity ? "ไม่จำกัด" : limits.branches}</span>
            </div>
          </div>
        </div>

        <PlanPicker currentPlan={user.store.plan} />
      </div>
    </div>
  );
}
