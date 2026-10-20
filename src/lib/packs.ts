// Packaging units (ลัง, แพ็ค) of a product. Stock is always stored in the product's base
// unit; these helpers convert to and from packs for display and data entry.

export type Pack = { id: string; name: string; size: number; barcode: string | null; sellPrice: number | null };

/** Packaging unit names offered when setting up a pack. */
export const PACK_UNITS = ["ลัง", "แพ็ค", "โหล", "กล่อง", "แผง", "ถาด", "มัด", "กระสอบ", "หีบ"];

/** Largest pack first, ignoring packs of size 1 (they don't change the breakdown). */
export function sortPacks<T extends { size: number }>(packs: T[]): T[] {
  return packs.filter((p) => p.size > 1).sort((a, b) => b.size - a.size);
}

/** Splits a base-unit quantity into packs, largest first, then loose units:
 * 58 ขวด with ลัง = 24 → [{ลัง, 2}, {ขวด, 10}]. Zero parts are left out (except a
 * zero total, which stays "0 <unit>"). */
export function splitStock(quantity: number, unit: string, packs: { name: string; size: number }[]) {
  const parts: { name: string; count: number }[] = [];
  let rest = Math.max(0, quantity);
  for (const pack of sortPacks(packs)) {
    const count = Math.floor(rest / pack.size);
    if (count > 0) parts.push({ name: pack.name, count });
    rest -= count * pack.size;
  }
  if (rest > 0 || parts.length === 0) parts.push({ name: unit, count: rest });
  return parts;
}

/** "2 ลัง 10 ขวด" — or plain "58 ขวด" for products without packs. */
export function formatStock(quantity: number, unit: string, packs: { name: string; size: number }[] = []) {
  if (quantity < 0) return `${quantity} ${unit}`;
  return splitStock(quantity, unit, packs)
    .map((p) => `${p.count.toLocaleString("th-TH")} ${p.name}`)
    .join(" ");
}

/** Price of a whole pack: its own price if set, else size × the single-unit price. */
export function packPrice(pack: { size: number; sellPrice: number | null }, unitPrice: number) {
  return pack.sellPrice ?? pack.size * unitPrice;
}
