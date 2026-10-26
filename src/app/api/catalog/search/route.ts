import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { catalogSourceInfo, looksLikeBarcode, lookupBarcodeOnline } from "@/lib/online-product-lookup";

const ITEM_FIELDS = {
  id: true,
  name: true,
  brand: true,
  category: true,
  unit: true,
  size: true,
  barcode: true,
  imageUrl: true,
  groupKey: true,
} as const;

/** Shared-catalog matches for a name, brand or exact barcode, leaving out items the
 * store already stocks — used when a store-side search comes up empty. A barcode is
 * looked up online (Open Food Facts family) the first time it's searched: the result —
 * with its photo and the same product in other sizes — is added to the catalog, and
 * the whole size group is returned with `online` naming the source. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [], total: 0 });

  if (looksLikeBarcode(q)) {
    const found = await lookupBarcodeOnline(q);
    if (found) {
      const items = await withoutOwned(
        session.storeId,
        found.group.map(({ id, name, brand, category, unit, size, barcode, imageUrl, groupKey }) =>
          ({ id, name, brand, category, unit, size, barcode, imageUrl, groupKey }),
        ),
      );
      return NextResponse.json({ items, total: items.length, online: catalogSourceInfo(found.row.source) });
    }
  }

  const where = { OR: [{ name: { contains: q } }, { brand: { contains: q } }, { barcode: q }] };
  const [total, candidates] = await Promise.all([
    prisma.catalogProduct.count({ where }),
    prisma.catalogProduct.findMany({
      where,
      orderBy: [{ popularity: "desc" }, { name: "asc" }],
      take: 12,
      select: ITEM_FIELDS,
    }),
  ]);

  const items = (await withoutOwned(session.storeId, candidates)).slice(0, 5);
  return NextResponse.json({ items, total });
}

/** Drops catalog items the store already has (same barcode or same name). */
async function withoutOwned<T extends { name: string; barcode: string | null }>(storeId: string, candidates: T[]) {
  const owned = await prisma.product.findMany({
    where: {
      storeId,
      OR: [
        { barcode: { in: candidates.flatMap((c) => (c.barcode ? [c.barcode] : [])) } },
        { name: { in: candidates.map((c) => c.name) } },
      ],
    },
    select: { barcode: true, name: true },
  });
  const ownedBarcodes = new Set(owned.flatMap((o) => (o.barcode ? [o.barcode] : [])));
  const ownedNames = new Set(owned.map((o) => o.name));
  return candidates.filter((c) => !(c.barcode && ownedBarcodes.has(c.barcode)) && !ownedNames.has(c.name));
}
