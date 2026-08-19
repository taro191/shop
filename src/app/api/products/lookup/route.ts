import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { productStockStatus } from "@/lib/status";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const barcode = request.nextUrl.searchParams.get("barcode");
  if (!barcode) return NextResponse.json({ error: "missing barcode" }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: { storeId: session.storeId, barcode },
  });

  if (!product) return NextResponse.json({ found: false });

  const status = productStockStatus(product.quantity);
  return NextResponse.json({
    found: true,
    product: {
      id: product.id,
      name: product.name,
      unit: product.unit,
      sellPrice: product.sellPrice,
      barcode: product.barcode,
      quantity: product.quantity,
      statusText: status.text,
      statusClassName: status.className,
    },
  });
}
