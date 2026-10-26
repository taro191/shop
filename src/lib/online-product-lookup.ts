import { prisma } from "@/lib/db";
import { THAI, asList, categorize, describeOffProduct, guessUnit, type OffProduct } from "@/lib/catalog-rules";

// Live barcode lookup in the Open Food Facts family of open databases (ODbL), used when
// a scanned barcode is in neither the store nor the shared catalog, or is in the catalog
// but hasn't been checked online yet. A hit is saved into the shared catalog with its
// photo, together with the same product in other sizes (found by searching the brand),
// so the next store that scans it finds it all without going online.

const SOURCES = [
  { host: "world.openfoodfacts.org", idPrefix: "off", source: "openfoodfacts", defaultCategory: null },
  { host: "world.openpetfoodfacts.org", idPrefix: "opff", source: "openpetfoodfacts", defaultCategory: "อาหารสัตว์" },
  { host: "world.openbeautyfacts.org", idPrefix: "obf", source: "openbeautyfacts", defaultCategory: "ของใช้ส่วนตัว" },
  { host: "world.openproductsfacts.org", idPrefix: "opf", source: "openproductsfacts", defaultCategory: "ของใช้ในบ้าน" },
] as const;

/** Food products whose tags and name match no catalog rule land here. */
const FOOD_FALLBACK_CATEGORY = "อาหารแห้ง";
const FIELDS =
  "code,product_name,product_name_th,product_name_en,generic_name,generic_name_th,abbreviated_product_name_th,brands,quantity,categories_tags,image_front_url,image_url";
const TIMEOUT_MS = 5000;
const SEARCH_TIMEOUT_MS = 8000;
const USER_AGENT = "grocery-shop-catalog/0.1 (https://shop.yaydang.com)";
/** Most sizes of one product we add from a single scan. */
const MAX_VARIANTS = 8;

type OnlineProduct = OffProduct & { image_front_url?: string; image_url?: string };

// Barcodes recently looked up and not found anywhere, so repeated scans of an unknown
// item don't hit the remote APIs every time. Per server process; cleared on restart.
const MISS_TTL_MS = 6 * 60 * 60 * 1000;
const recentMisses = new Map<string, number>();

export function looksLikeBarcode(q: string) {
  return /^\d{8,14}$/.test(q);
}

async function fetchProduct(host: string, barcode: string): Promise<OnlineProduct | null> {
  try {
    const res = await fetch(`https://${host}/api/v2/product/${barcode}?fields=${FIELDS}`, {
      headers: { "User-Agent": USER_AGENT },
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

/** Thai-registered (885…) products of a brand on Open Food Facts, via its search service. */
async function searchBrand(brand: string): Promise<OnlineProduct[]> {
  const params = new URLSearchParams({
    q: `brands:"${brand.replace(/["\\]/g, "")}" AND code:885*`,
    page_size: "100",
    fields: FIELDS,
  });
  try {
    const res = await fetch(`https://search.openfoodfacts.org/search?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.hits) ? data.hits : [];
  } catch {
    return [];
  }
}

const SIZE_TEXT = /\d+(?:[.,]\d+)?\s*(?:กิโลกรัม|กก\.?|กรัม|ก\.|มล\.?|มิลลิลิตร|ลิตร|ล\.|kg|g|ml|l)(?![a-z])/gi;

/** Whether a name has Thai words apart from its size ("Glutamate de sodium 250 ก." doesn't). */
function hasThaiName(name: string) {
  return THAI.test(name.replace(SIZE_TEXT, ""));
}

/** A name reduced for comparison: no size, brand, spaces or punctuation. */
function nameKey(name: string, brands: string[]) {
  let s = name.toLowerCase().replace(SIZE_TEXT, "");
  for (const b of brands) s = s.split(b.toLowerCase()).join("");
  return s.replace(/[\s\p{P}\p{S}]/gu, "");
}

/** Whether `other` is the same product as `main` in another size: the same name once
 * size and brand are removed — the Thai names when both have one, else the product
 * names. Sharing a category isn't enough: every flavour of a brand's chips shares one,
 * and an entry with no Thai name would then be given another flavour's Thai name. */
function isOtherSize(main: OnlineProduct, mainThai: string | null, other: OnlineProduct, otherThai: string | null) {
  const brands = [...asList(main.brands), ...asList(other.brands)];
  if (mainThai && otherThai) return nameKey(mainThai, brands) === nameKey(otherThai, brands);
  const mainNames = [main.product_name, main.product_name_en].map((n) => nameKey(n ?? "", brands)).filter(Boolean);
  const otherNames = [other.product_name, other.product_name_en].map((n) => nameKey(n ?? "", brands)).filter(Boolean);
  return mainNames.some((n) => otherNames.includes(n));
}

type CatalogData = {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  category: string;
  unit: string;
  size: string | null;
  source: string;
  imageUrl: string | null;
};

function toCatalogData(
  p: OnlineProduct,
  src: (typeof SOURCES)[number],
  thaiFallback: string | null,
  category?: string,
): CatalogData | null {
  const described = describeOffProduct(p, thaiFallback);
  if (!described) return null;
  const cat =
    category ??
    src.defaultCategory ??
    categorize(p, described.baseName) ??
    categorize({ categories_tags: [] }, described.baseName) ??
    FOOD_FALLBACK_CATEGORY;
  return {
    id: `${src.idPrefix}-${p.code}`,
    barcode: p.code,
    name: described.name,
    brand: described.brand,
    category: cat,
    unit: guessUnit(cat, described.name, described.size),
    size: described.size,
    source: src.source,
    imageUrl: p.image_front_url || p.image_url || null,
  };
}

/** Inserts or fills in a catalog row. An existing row keeps its curated fields, but a
 * Thai name replaces a foreign one, and a missing photo, size or group is filled in. */
async function saveCatalogRow(data: CatalogData, groupKey: string, checkedAt: Date) {
  const existing = await prisma.catalogProduct.findUnique({ where: { barcode: data.barcode } });
  if (!existing) {
    try {
      return await prisma.catalogProduct.create({ data: { ...data, groupKey, onlineCheckedAt: checkedAt } });
    } catch {
      // Another request saved the same barcode first.
      return prisma.catalogProduct.findUnique({ where: { barcode: data.barcode } });
    }
  }
  return prisma.catalogProduct.update({
    where: { id: existing.id },
    data: {
      ...(!hasThaiName(existing.name) && hasThaiName(data.name) ? { name: data.name } : {}),
      imageUrl: existing.imageUrl ?? data.imageUrl,
      size: existing.size ?? data.size,
      groupKey: existing.groupKey ?? groupKey,
      onlineCheckedAt: checkedAt,
    },
  });
}

/** All catalog rows in the barcode's size group (just the row itself if it has none),
 * smallest size first. */
async function catalogGroup(row: { id: string; groupKey: string | null }) {
  if (!row.groupKey) return prisma.catalogProduct.findMany({ where: { id: row.id } });
  const rows = await prisma.catalogProduct.findMany({ where: { groupKey: row.groupKey } });
  return rows.sort((a, b) => sizeInBaseUnits(a.size) - sizeInBaseUnits(b.size));
}

/** "1 กก." -> 1000, "250 ก." -> 250; unknown sizes sort last. */
function sizeInBaseUnits(size: string | null) {
  const m = size?.match(/^(\d+(?:\.\d+)?)\s*(กก\.|ล\.|ก\.|มล\.)/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * (m[2] === "กก." || m[2] === "ล." ? 1000 : 1);
}

/** Looks the barcode up online and stores it — with its photo and the same product in
 * other sizes — in the shared catalog. Returns the barcode's catalog row and the rows of
 * its size group (the row first), or null when no source knows it. A barcode already in
 * the catalog is only looked up once; after that its stored group is returned. */
export async function lookupBarcodeOnline(barcode: string) {
  if (!looksLikeBarcode(barcode)) return null;

  const known = await prisma.catalogProduct.findUnique({ where: { barcode } });
  if (known?.onlineCheckedAt) return { row: known, group: await catalogGroup(known) };
  const missedAt = recentMisses.get(barcode);
  if (!known && missedAt && Date.now() - missedAt < MISS_TTL_MS) return null;

  const results = await Promise.all(SOURCES.map((s) => fetchProduct(s.host, barcode)));
  const index = results.findIndex((p, i) => p && toCatalogData(p, SOURCES[i], null));
  const checkedAt = new Date();

  if (index < 0) {
    if (!known) {
      recentMisses.set(barcode, Date.now());
      return null;
    }
    const row = await prisma.catalogProduct.update({ where: { id: known.id }, data: { onlineCheckedAt: checkedAt } });
    return { row, group: await catalogGroup(row) };
  }

  const src = SOURCES[index];
  const main = results[index]!;
  const mainData = toCatalogData(main, src, null)!;
  const mainThai = describeOffProduct(main)?.thaiName ?? null;
  const thaiBase = mainThai ? mainThai.replace(SIZE_TEXT, "").replace(/\s+/g, " ").trim() : null;

  // Other sizes: same brand, Thai barcode, a size we don't have yet. Only Open Food
  // Facts has a search service, so other sources get no size group.
  const variants: CatalogData[] = [];
  const brand = asList(main.brands)[0];
  if (src.source === "openfoodfacts" && brand) {
    const sizes = new Set([mainData.size]);
    for (const other of await searchBrand(brand)) {
      if (variants.length >= MAX_VARIANTS) break;
      if (other.code === barcode || !/^885\d{10}$/.test(other.code)) continue;
      const otherThai = describeOffProduct(other)?.thaiName ?? null;
      if (!isOtherSize(main, mainThai, other, otherThai)) continue;
      const data = toCatalogData(other, src, thaiBase, mainData.category);
      if (!data?.size || sizes.has(data.size)) continue;
      sizes.add(data.size);
      variants.push(data);
    }
  }

  // Join an existing group if one of the sizes already belongs to one.
  const barcodes = [mainData.barcode, ...variants.map((v) => v.barcode)];
  const grouped = await prisma.catalogProduct.findFirst({
    where: { barcode: { in: barcodes }, groupKey: { not: null } },
    select: { groupKey: true },
  });
  const groupKey = grouped?.groupKey ?? `g-${barcode}`;

  const row = await saveCatalogRow(mainData, groupKey, checkedAt);
  for (const v of variants) await saveCatalogRow(v, groupKey, checkedAt);
  if (!row) return null;
  return { row, group: await catalogGroup(row) };
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
