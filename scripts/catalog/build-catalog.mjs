// Builds prisma/catalog/catalog.json — the shared product catalog — from
//   1. Open Food Facts search exports for Thailand (ODbL, https://openfoodfacts.org),
//      downloaded as JSON pages from search.openfoodfacts.org into <rawDir>
//   2. scripts/catalog/curated.json — hand-written staples, household/personal-care items
//      and ยาสามัญประจำบ้าน (household remedies a grocery may legally sell) that Open
//      Food Facts doesn't cover (no barcodes)
//   3. scripts/catalog/petfood.json — Thai-barcoded pet food from Open Pet Food Facts
//      (ODbL, https://openpetfoodfacts.org), names rewritten in Thai by hand since the
//      source entries are mostly English with unreliable quantities
//
// Usage: node scripts/catalog/build-catalog.mjs <rawDir>
//
// Only grocery-store (ร้านโชห่วย) goods are kept: Thai-registered barcodes (885…),
// no convenience-store/hypermarket house brands, no ready meals, fresh produce or
// supplements.
import fs from "node:fs";
import path from "node:path";
import { asList, categorize, describeOffProduct, guessUnit } from "../../src/lib/catalog-rules.ts";

const rawDir = process.argv[2];
if (!rawDir) {
  console.error("usage: node scripts/catalog/build-catalog.mjs <rawDir>");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "../..");

const raw = new Map();
for (const f of fs.readdirSync(rawDir).filter((f) => /^off_\d+\.json$/.test(f))) {
  for (const p of JSON.parse(fs.readFileSync(path.join(rawDir, f), "utf8")).hits) raw.set(p.code, p);
}

// Convenience-store / hypermarket house brands and ready-meal makers — not stocked by grocery shops.
const EXCLUDED_BRANDS =
  /^(7-?11|7-?eleven|เซเว่น|7\s?fresh|7เฟรช|ezygo|อีซี่โก|ezy ?bake|อีซี่เบค|tesco|เทสโก้|lotus'?s?|โลตัส|tops|ท็อปส์|my choice|มายช้อยส์|makro|แม็คโคร|aro|เอโร่|big ?c|บิ๊กซี|cpram|ซีพีแรม|lepain|le pain|เลอแปง|s-?p|เอสแอนด์พี|family ?mart|แฟมิลี่มาร์ท|lawson|ลอว์สัน)$/i;

const items = [];
for (const p of raw.values()) {
  if (!/^885\d{10}$/.test(p.code)) continue;
  const brands = asList(p.brands);
  if (brands.some((b) => EXCLUDED_BRANDS.test(b))) continue;

  const described = describeOffProduct(p);
  if (!described) continue;
  const category = categorize(p, described.baseName);
  if (!category) continue;
  const { name, brand, size } = described;

  items.push({
    id: `off-${p.code}`,
    barcode: p.code,
    name,
    brand,
    category,
    unit: guessUnit(category, name, size),
    size,
    source: "openfoodfacts",
    popularity: p.unique_scans_n ?? 0,
  });
}

const petfood = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "petfood.json"), "utf8"));
for (const p of petfood) {
  items.push({
    id: `opff-${p.barcode}`,
    barcode: p.barcode,
    name: p.name,
    brand: p.brand ?? null,
    category: "อาหารสัตว์",
    unit: p.unit,
    size: p.size ?? null,
    source: "openpetfoodfacts",
    popularity: 0,
  });
}

const curated = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "curated.json"), "utf8"));
for (const [i, c] of curated.entries()) {
  items.push({
    id: `cur-${String(i + 1).padStart(4, "0")}`,
    barcode: null,
    name: c.name,
    brand: c.brand ?? null,
    category: c.category,
    unit: c.unit,
    size: c.size ?? null,
    source: "curated",
    popularity: 0,
  });
}

items.sort((a, b) => a.category.localeCompare(b.category, "th") || b.popularity - a.popularity || a.name.localeCompare(b.name, "th"));
const outPath = path.join(root, "prisma/catalog/catalog.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(items, null, 0).replace(/\},\{/g, "},\n{") + "\n");

const byCat = {};
for (const it of items) byCat[it.category] = (byCat[it.category] ?? 0) + 1;
console.log(`wrote ${items.length} items to ${path.relative(root, outPath)}`, byCat);
