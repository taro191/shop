import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { BranchesList } from "@/components/branches/BranchesList";
import { planLimits } from "@/lib/plan";

export default async function BranchesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "OWNER") redirect("/dashboard");

  const branches = await prisma.branch.findMany({
    where: { storeId: user.storeId },
    orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { users: true } } },
  });

  const limit = planLimits(user.store.plan).branches;

  return (
    <div className="mx-auto max-w-[680px] pb-10">
      <PageHeader title="สาขา" subtitle="จัดการสาขาของร้าน — ยอดขายและบิลซื้อจะแยกตามสาขาที่เลือก" />
      <div className="px-5 pt-4 sm:px-8">
        <BranchesList
          branches={branches.map((b) => ({ id: b.id, name: b.name, address: b.address, isMain: b.isMain, staffCount: b._count.users }))}
          atLimit={branches.length >= limit}
          limit={limit}
        />
      </div>
    </div>
  );
}
