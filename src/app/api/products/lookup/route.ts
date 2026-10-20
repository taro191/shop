import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { productStockStatus } from "@/lib/status";
import { formatStock, packPrice } from "@/lib/packs";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const barcode = request.nextUrl.searchParams.get("barcode");
  if (!barcode) return NextResponse.json({ error: "missing barcode" }, { status: 400 });

  // The code may be the product's own barcode or one of its packs (a case of 24).
  const product = await prisma.product.findFirst({
    where: { storeId: session.storeId, OR: [{ barcode }, { packs: { some: { barcode } } }] },
    include: { packs: { orderBy: { size: "desc" } } },
  });

  if (!product) return NextResponse.json({ found: false });

  const scannedPack = product.barcode === barcode ? null : (product.packs.find((p) => p.barcode === barcode) ?? null);
  const status = productStockStatus(product.quantity);
  return NextResponse.json({
    found: true,
    product: {
      id: product.id,
      name: product.name,
      unit: scannedPack ? `${scannedPack.name} (${scannedPack.size} ${product.unit})` : product.unit,
      sellPrice: scannedPack ? packPrice(scannedPack, product.sellPrice) : product.sellPrice,
      barcode,
      quantity: product.quantity,
      stockText: formatStock(product.quantity, product.unit, product.packs),
      statusText: status.text,
      statusClassName: status.className,
      // Every other way the product is sold, for "also sold as" prices.
      otherPrices: [
        ...(scannedPack ? [{ label: product.unit, price: product.sellPrice }] : []),
        ...product.packs
          .filter((p) => p.id !== scannedPack?.id)
          .map((p) => ({ label: `${p.name} (${p.size} ${product.unit})`, price: packPrice(p, product.sellPrice) })),
      ],
    },
  });
}
