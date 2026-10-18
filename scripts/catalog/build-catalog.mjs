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

const THAI = /[฀-๿]/;
const asList = (v) => (Array.isArray(v) ? v : v ? String(v).split(",") : []).map((s) => s.trim()).filter(Boolean);

// Convenience-store / hypermarket house brands and ready-meal makers — not stocked by grocery shops.
const EXCLUDED_BRANDS =
  /^(7-?11|7-?eleven|เซเว่น|7\s?fresh|7เฟรช|ezygo|อีซี่โก|ezy ?bake|อีซี่เบค|tesco|เทสโก้|lotus'?s?|โลตัส|tops|ท็อปส์|my choice|มายช้อยส์|makro|แม็คโคร|aro|เอโร่|big ?c|บิ๊กซี|cpram|ซีพีแรม|lepain|le pain|เลอแปง|s-?p|เอสแอนด์พี|family ?mart|แฟมิลี่มาร์ท|lawson|ลอว์สัน)$/i;

const EXCLUDED_TAGS =
  /^en:(meals|.*-meals|meals-with-.*|sandwiches|.*-sandwiches|hamburgers|salads|fried-rice|prepared-rices|pasta-dishes|dumplings|frozen-foods|dietary-supplements|bodybuilding-supplements|protein-shakes|fresh-.*|farming-products|meats|poultries|chickens|pork|sausages|prepared-meats|fish-fillets|surimi|vegetables|fruits|tropical-fruits|cheeses|to-be-deleted|baby-foods|tofu|viennoiseries|croissants|pastries|buns)$/;

// First matching rule wins. `tags` match Open Food Facts category tags; `words` match the
// product name (used for products with no category tags).
const RULES = [
  { category: "ยาและเวชภัณฑ์", tags: /^(th:ยาจากสมุนไพร|en:medicines|en:herbal-medicines)$/, words: /^ยา(ดม|หอม|หม่อง|แคปซูล|อม|แก้|ธาตุ|เม็ด)/ },
  { category: "บะหมี่กึ่งสำเร็จรูป", tags: /^en:(instant-noodles|congee)$/, words: /บะหมี่|มาม่า|ไวไว|ยำยำ|โจ๊กคัพ|เส้นหมี่กึ่ง/ },
  { category: "อาหารกระป๋อง", tags: /^en:(canned-foods|canned-.*|sardines.*|tunas|mackerels|mackerel-.*)$/, words: /กระป๋อง|ปลาซาร์ดีน|ทูน่า|แมคเคอเรล/ },
  {
    category: "เครื่องดื่ม",
    tags: /^en:(coffees|instant-coffees|coffee-drinks|teas|green-teas|waters|sodas|colas|fruit-sodas|carbonated-drinks|energy-drinks|juices-and-nectars|fruit-juices|fruit-nectars|.*-juices|beers|instant-beverages|cocoa-and-chocolate-powders|cereal-based-drinks|sweetened-beverages|artificially-sweetened-beverages|unsweetened-beverages|non-alcoholic-beverages)$/,
    words: /กาแฟ|ชาเขียว|น้ำดื่ม|น้ำแร่|น้ำผลไม้|น้ำส้ม|โซดา|เครื่องดื่ม|เบียร์/,
  },
  {
    category: "นมและผลิตภัณฑ์นม",
    tags: /^en:(milks|whole-milks|flavoured-milks|chocolate-milks|lactose-free-milk|dairy-drinks|yogurts|drinkable-yogurts|fermented-milk-drinks|condensed-milks|sweetened-condensed-milk|milk-tablet|soy-based-drinks|plant-based-milk-alternatives|milk-substitutes|almond-based-drinks|nut-based-drinks)$/,
    words: /นม|โยเกิร์ต|ยาคูลท์/,
  },
  {
    category: "เครื่องปรุง",
    tags: /^en:(condiments|sauces|soy-sauces|nuoc-mam-sauce|fish-sauces|chili-paste|hot-sauces|ketchup|tomato-sauces|salad-dressings|vegetable-oils|fats|vegetable-fats|spices|sweeteners|sugars|salts|food-additives|coconut-milks-and-creams|plant-based-creams-for-cooking|vinegars)$/,
    words: /น้ำปลา|ซีอิ๊ว|ซอส|น้ำพริก|น้ำมันพืช|น้ำมันปาล์ม|ผงปรุง|ซุปก้อน|น้ำส้มสายชู|กะทิ|น้ำตาล|เกลือ|ผงชูรส/,
  },
  {
    category: "ขนม",
    tags: /^en:(snacks|sweet-snacks|salty-snacks|biscuits|biscuits-and-cakes|biscuits-and-crackers|crackers|chips-and-fries|crisps|potato-crisps|flavoured-potato-crisps|corn-chips|sweet-potato-crisps|rice-crisp|wafers|candies|confectioneries|chocolates|cakes|chocolate-cakes|fish-snack|peanuts|nuts|seaweed-products|cereal-bars|bars|ice-creams|ice-creams-and-sorbets|breads|white-breads|wheat-breads|dorayaki|desserts)$/,
    words: /ขนม|เลย์|ข้าวเกรียบ|บิสกิต|เวเฟอร์|ลูกอม|ช็อกโกแลต|ไอศกรีม|ขนมปัง|สาหร่าย|ถั่ว/,
  },
  {
    category: "อาหารแห้ง",
    tags: /^en:(rices|brown-rices|flours|cereal-flours|pastas|noodles|cellophane-noodles|spaghetti|dried-products|legumes|pulses|cereal-grains|breakfast-cereals|eggs|groceries)$/,
    words: /ข้าวสาร|ข้าวหอม|แป้ง|วุ้นเส้น|เส้นหมี่|เส้นก๋วยเตี๋ยว|ไข่ไก่|ไข่เป็ด/,
  },
];

// Packaged snacks that Open Food Facts files under legumes/breads/spreads rather than snacks.
const SNACK_NAME = /ขนมปัง|ถั่ว.*(อบ|เคลือบ|ทอด|กรอบ)|อบกรอบ|ข้าวเกรียบ|ข้าวตัง/;

function categorize(p, name) {
  const tags = p.categories_tags ?? [];
  if (tags.some((t) => EXCLUDED_TAGS.test(t))) return null;
  if (SNACK_NAME.test(name) || tags.some((t) => /^en:(breads|.*-breads)$/.test(t))) return "ขนม";
  for (const r of RULES) if (tags.some((t) => r.tags.test(t))) return r.category;
  if (tags.length === 0) for (const r of RULES) if (r.words.test(name)) return r.category;
  return null;
}

const UNIT_WORDS = { g: "ก.", kg: "กก.", ml: "มล.", l: "ล.", cl: "ซล." };

/** "55 g" -> "55 ก."; only the first quantity, ignoring "each"/"dried weight" notes. */
function formatSize(quantity) {
  const m = String(quantity ?? "").match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\b/i);
  if (!m) return null;
  const n = m[1].replace(",", ".");
  const unit = m[2].toLowerCase();
  if (unit === "cl") return `${Number(n) * 10} มล.`;
  return `${Number(n)} ${UNIT_WORDS[unit]}`;
}

function guessUnit(category, name, size) {
  const liquid = /มล\.|ล\./.test(size ?? "");
  if (/คัพ|ถ้วย|cup/i.test(name)) return "ถ้วย";
  if (/กระป๋อง|\bcan\b/i.test(name)) return "กระป๋อง";
  switch (category) {
    case "บะหมี่กึ่งสำเร็จรูป":
      return "ซอง";
    case "อาหารกระป๋อง":
      return "กระป๋อง";
    case "นมและผลิตภัณฑ์นม":
      if (liquid) return /ขวด/.test(name) ? "ขวด" : "กล่อง";
      return /ข้น/.test(name) ? "กระป๋อง" : /ผง|เม็ด/.test(name) ? "ซอง" : "ถ้วย";
    case "เครื่องดื่ม":
      return liquid ? "ขวด" : "ห่อ";
    case "เครื่องปรุง":
      return liquid ? "ขวด" : "ถุง";
    case "ขนม":
      return /ไอศกรีม/.test(name) ? "ชิ้น" : /ขนมปัง/.test(name) ? "ถุง" : "ซอง";
    case "อาหารแห้ง":
      return /ไข่/.test(name) ? "แผง" : "ถุง";
    case "ยาและเวชภัณฑ์":
      return /ยาดม/.test(name) ? "หลอด" : /แคปซูล/.test(name) || liquid ? "ขวด" : "ซอง";
    default:
      return "ชิ้น";
  }
}

const clean = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+-\s+.*$/, "") // drop " - brand - size" suffixes some contributors add
    .trim();

const items = [];
for (const p of raw.values()) {
  if (!/^885\d{10}$/.test(p.code)) continue;
  const brands = asList(p.brands);
  if (brands.some((b) => EXCLUDED_BRANDS.test(b))) continue;

  const thaiName = [p.product_name_th, p.product_name].map(clean).find((n) => THAI.test(n));
  const baseName = thaiName || clean(p.product_name) || clean(p.product_name_en);
  if (!baseName || baseName.length < 3 || /^\d+$/.test(baseName)) continue;
  // Untranslated foreign-language entries (e.g. German/French export labels) aren't useful to Thai shops.
  if (!thaiName && /[àâçéèêëîïôûùüÿœäöß]|\b(et|und|mit|avec|aux)\b/i.test(baseName)) continue;

  const category = categorize(p, baseName);
  if (!category) continue;

  const brand = brands.find((b) => THAI.test(b)) ?? brands[0] ?? null;
  const size = formatSize(p.quantity);
  const lowerName = baseName.toLowerCase();
  let name = baseName;
  if (brand && !brands.some((b) => lowerName.includes(b.toLowerCase()))) name = `${brand} ${name}`;
  if (size && !/\d\s*(ก\.|กรัม|g|ml|มล|ล\.|ลิตร|kg|กก)/i.test(name)) name = `${name} ${size}`;

  items.push({
    id: `off-${p.code}`,
    barcode: p.code,
    name: name.slice(0, 180),
    brand: brand ? brand.slice(0, 120) : null,
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
