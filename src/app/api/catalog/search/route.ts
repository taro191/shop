import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Shared-catalog matches for a name, brand or exact barcode, leaving out items the
 * store already stocks — used when a store-side search comes up empty. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [], total: 0 });

  const where = { OR: [{ name: { contains: q } }, { brand: { contains: q } }, { barcode: q }] };
  const [total, candidates] = await Promise.all([
    prisma.catalogProduct.count({ where }),
    prisma.catalogProduct.findMany({
      where,
      orderBy: [{ popularity: "desc" }, { name: "asc" }],
      take: 12,
      select: { id: true, name: true, brand: true, unit: true, size: true, barcode: true },
    }),
  ]);

  const owned = await prisma.product.findMany({
    where: {
      storeId: session.storeId,
      OR: [
        { barcode: { in: candidates.flatMap((c) => (c.barcode ? [c.barcode] : [])) } },
        { name: { in: candidates.map((c) => c.name) } },
      ],
    },
    select: { barcode: true, name: true },
  });
  const ownedBarcodes = new Set(owned.flatMap((o) => (o.barcode ? [o.barcode] : [])));
  const ownedNames = new Set(owned.map((o) => o.name));
  const items = candidates.filter((c) => !(c.barcode && ownedBarcodes.has(c.barcode)) && !ownedNames.has(c.name)).slice(0, 5);

  return NextResponse.json({ items, total });
}
