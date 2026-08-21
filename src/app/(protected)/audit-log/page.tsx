import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuditLogList } from "@/components/audit/AuditLogList";
import { formatThaiDate, formatThaiTime } from "@/lib/format";

export default async function AuditLogPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "OWNER") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    where: { storeId: user.storeId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-[680px] pb-10">
      <PageHeader title="ประวัติการใช้งาน" subtitle="ใครแก้ไขอะไร เมื่อไหร่ — ครอบคลุมสินค้า พนักงาน สาขา บิลซื้อ ตรวจนับสต๊อก และการตั้งค่า" />
      <div className="px-5 pt-4 sm:px-8">
        <AuditLogList
          logs={logs.map((l) => ({
            id: l.id,
            userName: l.userName,
            action: l.action,
            summary: l.summary,
            dateLabel: formatThaiDate(l.createdAt),
            timeLabel: formatThaiTime(l.createdAt),
          }))}
        />
      </div>
    </div>
  );
}
