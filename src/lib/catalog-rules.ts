// Naming and category rules for Open Food Facts–family products, shared by the catalog
// build script (scripts/catalog/build-catalog.mjs, run with Node's TypeScript type
// stripping) and the live barcode lookup (src/lib/online-product-lookup.ts). Keep this
// file to erasable TypeScript syntax so Node can run it without a compiler.

/** The fields we read from an Open Food Facts product. */
export type OffProduct = {
  code: string;
  product_name?: string;
  product_name_th?: string;
  product_name_en?: string;
  generic_name?: string;
  generic_name_th?: string;
  abbreviated_product_name_th?: string;
  brands?: string | string[];
  quantity?: string;
  categories_tags?: string[];
  unique_scans_n?: number;
};

export const THAI = /[฀-๿]/;
export const asList = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? String(v).split(",") : []).map((s) => s.trim()).filter(Boolean);

export const EXCLUDED_TAGS =
  /^en:(meals|.*-meals|meals-with-.*|sandwiches|.*-sandwiches|hamburgers|salads|fried-rice|prepared-rices|pasta-dishes|dumplings|frozen-foods|dietary-supplements|bodybuilding-supplements|protein-shakes|fresh-.*|farming-products|meats|poultries|chickens|pork|sausages|prepared-meats|fish-fillets|surimi|vegetables|fruits|tropical-fruits|cheeses|to-be-deleted|baby-foods|tofu|viennoiseries|croissants|pastries|buns)$/;

// First matching rule wins. `tags` match Open Food Facts category tags; `words` match the
// product name (used for products with no category tags).
export const RULES: { category: string; tags: RegExp; words: RegExp }[] = [
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
export const SNACK_NAME = /ขนมปัง|ถั่ว.*(อบ|เคลือบ|ทอด|กรอบ)|อบกรอบ|ข้าวเกรียบ|ข้าวตัง/;

export function categorize(p: Pick<OffProduct, "categories_tags">, name: string): string | null {
  const tags = p.categories_tags ?? [];
  if (tags.some((t) => EXCLUDED_TAGS.test(t))) return null;
  if (SNACK_NAME.test(name) || tags.some((t) => /^en:(breads|.*-breads)$/.test(t))) return "ขนม";
  for (const r of RULES) if (tags.some((t) => r.tags.test(t))) return r.category;
  if (tags.length === 0) for (const r of RULES) if (r.words.test(name)) return r.category;
  return null;
}

const UNIT_WORDS: Record<string, string> = { g: "ก.", kg: "กก.", ml: "มล.", l: "ล.", cl: "ซล." };

/** "55 g" -> "55 ก."; only the first quantity, ignoring "each"/"dried weight" notes. */
export function formatSize(quantity: string | undefined | null): string | null {
  const m = String(quantity ?? "").match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\b/i);
  if (!m) return null;
  const n = m[1].replace(",", ".");
  const unit = m[2].toLowerCase();
  if (unit === "cl") return `${Number(n) * 10} มล.`;
  return `${Number(n)} ${UNIT_WORDS[unit]}`;
}

export function guessUnit(category: string, name: string, size: string | null): string {
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

export const clean = (s: string | undefined | null): string =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+-\s+.*$/, "") // drop " - brand - size" suffixes some contributors add
    .trim();

/** The product's Thai name, if any field has one. Many Thai entries keep a foreign
 * product_name and put the Thai name in generic_name_th (e.g. "Glutamate de sodium" /
 * "ผงชูรส"); generic names longer than a short label are descriptions, not names. */
export function thaiNameOf(p: OffProduct): string | null {
  const names = [p.product_name_th, p.product_name, p.abbreviated_product_name_th].map(clean);
  const generic = [p.generic_name_th, p.generic_name].map(clean).filter((n) => n.length <= 60);
  return [...names, ...generic].find((n) => THAI.test(n)) ?? null;
}

/** Display name, brand and size for an Open Food Facts product, preferring the Thai
 * name; null when it has no usable name (blank, numeric, or an untranslated
 * foreign-language label that isn't useful to Thai shops). `thaiFallback` stands in
 * for a missing Thai name — used for another size of a product whose Thai name is known. */
export function describeOffProduct(
  p: OffProduct,
  thaiFallback?: string | null,
): { name: string; baseName: string; thaiName: string | null; brand: string | null; size: string | null } | null {
  const brands = asList(p.brands);
  const thaiName = thaiNameOf(p) ?? thaiFallback ?? null;
  const baseName = thaiName || clean(p.product_name) || clean(p.product_name_en);
  if (!baseName || baseName.length < 3 || /^\d+$/.test(baseName)) return null;
  // Untranslated foreign-language entries (e.g. German/French export labels) aren't useful to Thai shops.
  if (!thaiName && /[àâçéèêëîïôûùüÿœäöß]|\b(et|und|mit|avec|aux)\b/i.test(baseName)) return null;

  const brand = brands.find((b) => THAI.test(b)) ?? brands[0] ?? null;
  const size = formatSize(p.quantity);
  const lowerName = baseName.toLowerCase();
  let name = baseName;
  if (brand && !brands.some((b) => lowerName.includes(b.toLowerCase()))) name = `${brand} ${name}`;
  if (size && !/\d\s*(ก\.|กรัม|g|ml|มล|ล\.|ลิตร|kg|กก)/i.test(name)) name = `${name} ${size}`;
  return { name: name.slice(0, 180), baseName, thaiName, brand: brand ? brand.slice(0, 120) : null, size };
}
