import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { CustomersList } from "@/components/customers/CustomersList";

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const customers = await prisma.customer.findMany({
    where: { storeId: user.storeId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pb-10">
      <PageHeader title="ลูกค้า / สมาชิก" subtitle="รายชื่อลูกค้าและแต้มสะสม — ซื้อ ฿1 ได้ 1 แต้ม แลกแต้มเป็นส่วนลดได้ 1 แต้ม = ฿1" />
      <div className="px-5 pt-5 sm:px-8">
        <CustomersList customers={customers.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))} />
      </div>
    </div>
  );
}
