import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LabelsPicker } from "@/components/LabelsPicker";

export default async function LabelsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const products = await prisma.product.findMany({
    where: { storeId: user.storeId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true, sellPrice: true, barcode: true },
  });

  return (
    <div className="pb-10">
      <PageHeader title="พิมพ์ป้ายราคา" subtitle="เลือกสินค้าและจำนวนดวงที่ต้องการพิมพ์ ป้ายจะมีบาร์โค้ดให้สแกนได้ (ถ้าสินค้ามีบาร์โค้ด)" />
      <div className="px-5 pt-5 sm:px-8">
        <LabelsPicker products={products} storeName={user.store.name} />
      </div>
    </div>
  );
}
