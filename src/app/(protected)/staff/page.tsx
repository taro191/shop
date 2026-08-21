import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StaffManager } from "@/components/staff/StaffManager";
import { planLimits } from "@/lib/plan";

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "OWNER") redirect("/dashboard");

  const [staff, branches] = await Promise.all([
    prisma.user.findMany({
      where: { storeId: user.storeId },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
      include: { branch: true },
    }),
    prisma.branch.findMany({ where: { storeId: user.storeId }, orderBy: { isMain: "desc" } }),
  ]);

  const activeCount = staff.filter((s) => s.active).length;
  const limit = planLimits(user.store.plan).staff;

  return (
    <div className="mx-auto max-w-[680px] pb-10">
      <PageHeader title="จัดการพนักงาน" subtitle="เพิ่มบัญชีพนักงาน กำหนดสิทธิ์ และผูกกับสาขา" />
      <div className="px-5 pt-4 sm:px-8">
        <StaffManager
          staff={staff.map((s) => ({
            id: s.id,
            name: s.name,
            phone: s.phone,
            role: s.role,
            active: s.active,
            branchName: s.branch?.name ?? null,
            isSelf: s.id === user.id,
          }))}
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          activeCount={activeCount}
          limit={limit}
        />
      </div>
    </div>
  );
}
