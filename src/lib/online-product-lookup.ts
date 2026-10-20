import { prisma } from "@/lib/db";
import { categorize, describeOffProduct, guessUnit, type OffProduct } from "@/lib/catalog-rules";

// Live barcode lookup in the Open Food Facts family of open databases (ODbL), used when
// a scanned barcode is in neither the store nor the shared catalog. A hit is saved into
// the shared catalog, so the next store that scans it finds it without going online.

const SOURCES = [
  { host: "world.openfoodfacts.org", idPrefix: "off", source: "openfoodfacts", defaultCategory: null },
  { host: "world.openpetfoodfacts.org", idPrefix: "opff", source: "openpetfoodfacts", defaultCategory: "อาหารสัตว์" },
  { host: "world.openbeautyfacts.org", idPrefix: "obf", source: "openbeautyfacts", defaultCategory: "ของใช้ส่วนตัว" },
  { host: "world.openproductsfacts.org", idPrefix: "opf", source: "openproductsfacts", defaultCategory: "ของใช้ในบ้าน" },
] as const;

/** Food products whose tags and name match no catalog rule land here. */
const FOOD_FALLBACK_CATEGORY = "อาหารแห้ง";
const FIELDS = "code,product_name,product_name_th,product_name_en,brands,quantity,categories_tags";
const TIMEOUT_MS = 5000;

// Barcodes recently looked up and not found anywhere, so repeated scans of an unknown
// item don't hit the remote APIs every time. Per server process; cleared on restart.
const MISS_TTL_MS = 6 * 60 * 60 * 1000;
const recentMisses = new Map<string, number>();

export function looksLikeBarcode(q: string) {
  return /^\d{8,14}$/.test(q);
}

async function fetchProduct(host: string, barcode: string): Promise<OffProduct | null> {
  try {
    const res = await fetch(`https://${host}/api/v2/product/${barcode}?fields=${FIELDS}`, {
      headers: { "User-Agent": "grocery-shop-catalog/0.1 (https://shop.yaydang.com)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.status === 1 && data.product ? { ...data.product, code: barcode } : null;
  } catch {
    return null;
  }
}

/** Looks the barcode up online and, when found, stores it in the shared catalog and
 * returns the new catalog row. Null when no source knows it (or all are unreachable). */
export async function lookupBarcodeOnline(barcode: string) {
  if (!looksLikeBarcode(barcode)) return null;
  const missedAt = recentMisses.get(barcode);
  if (missedAt && Date.now() - missedAt < MISS_TTL_MS) return null;

  const results = await Promise.all(SOURCES.map((s) => fetchProduct(s.host, barcode)));
  for (const [i, product] of results.entries()) {
    if (!product) continue;
    const described = describeOffProduct(product);
    if (!described) continue;

    const src = SOURCES[i];
    const category =
      src.defaultCategory ??
      categorize(product, described.baseName) ??
      categorize({ categories_tags: [] }, described.baseName) ??
      FOOD_FALLBACK_CATEGORY;

    const data = {
      id: `${src.idPrefix}-${barcode}`,
      barcode,
      name: described.name,
      brand: described.brand,
      category,
      unit: guessUnit(category, described.name, described.size),
      size: described.size,
      source: src.source,
    };
    try {
      return await prisma.catalogProduct.create({ data });
    } catch {
      // Another request saved the same barcode first.
      return prisma.catalogProduct.findUnique({ where: { barcode } });
    }
  }

  recentMisses.set(barcode, Date.now());
  return null;
}

/** Display name and link for a catalog row's source, for attribution (ODbL). */
export function catalogSourceInfo(source: string): { label: string; url: string } | null {
  switch (source) {
    case "openfoodfacts":
      return { label: "Open Food Facts", url: "https://world.openfoodfacts.org" };
    case "openpetfoodfacts":
      return { label: "Open Pet Food Facts", url: "https://world.openpetfoodfacts.org" };
    case "openbeautyfacts":
      return { label: "Open Beauty Facts", url: "https://world.openbeautyfacts.org" };
    case "openproductsfacts":
      return { label: "Open Products Facts", url: "https://world.openproductsfacts.org" };
    default:
      return null;
  }
}
