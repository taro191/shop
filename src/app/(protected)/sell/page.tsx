import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { SellCart } from "@/components/sell/SellCart";

export default async function SellPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [products, customers, branches] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: user.storeId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, category: true, sellPrice: true, quantity: true, barcode: true },
    }),
    prisma.customer.findMany({
      where: { storeId: user.storeId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, points: true },
    }),
    prisma.branch.findMany({
      where: { storeId: user.storeId },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="pb-4">
      <PageHeader title="ขายสินค้า" subtitle="เลือกหรือสแกนสินค้าเพื่อขาย ระบบจะตัดสต๊อกให้อัตโนมัติ" />
      <SellCart
        products={products}
        customers={customers}
        storeName={user.store.name}
        promptPayId={user.store.promptPayId}
        branches={branches}
        defaultBranchId={user.branchId ?? branches[0]?.id ?? null}
      />
    </div>
  );
}
