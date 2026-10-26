"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { barcodeOwner } from "@/lib/barcodes";

export type ActionState = { error?: string } | null;

const productSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า"),
  category: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  barcode: z.string().trim().optional(),
  costPrice: z.coerce.number().min(0),
  sellPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(0),
  expiresAt: z.string().trim().optional(),
  // A photo URL from the shared catalog (https only), used when no photo is uploaded.
  imageUrl: z.string().trim().max(500).startsWith("https://").optional(),
  groupKey: z.string().trim().max(191).optional(),
});

/** Largest uploaded photo we keep; the form shrinks photos to well under this. */
const MAX_IMAGE_BYTES = 600 * 1024;

/** Decodes a photo sent by the add-product form as a JPEG/PNG/WebP data URL. */
function decodeImage(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return null;
  const m = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return { error: "ไฟล์รูปไม่ถูกต้อง" } as const;
  const data = Buffer.from(m[2], "base64");
  if (data.length > MAX_IMAGE_BYTES) return { error: "รูปใหญ่เกินไป" } as const;
  return { mimeType: m[1], data } as const;
}

export async function addProductAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    unit: formData.get("unit"),
    barcode: formData.get("barcode") || undefined,
    costPrice: formData.get("costPrice"),
    sellPrice: formData.get("sellPrice"),
    quantity: formData.get("quantity"),
    expiresAt: formData.get("expiresAt") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    groupKey: formData.get("groupKey") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const upload = decodeImage(formData.get("imageData"));
  if (upload && "error" in upload) return { error: upload.error };

  const barcode = parsed.data.barcode || null;
  if (barcode) {
    const owner = await barcodeOwner(session.storeId, barcode);
    if (owner) return { error: `บาร์โค้ดนี้ใช้กับ "${owner}" อยู่แล้ว` };
  }

  const image = upload
    ? await prisma.productImage.create({ data: { storeId: session.storeId, mimeType: upload.mimeType, data: upload.data } })
    : null;

  const product = await prisma.product.create({
    data: {
      storeId: session.storeId,
      name: parsed.data.name,
      category: parsed.data.category,
      unit: parsed.data.unit,
      barcode,
      costPrice: parsed.data.costPrice,
      sellPrice: parsed.data.sellPrice,
      quantity: parsed.data.quantity,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      imageUrl: image ? `/api/images/${image.id}` : (parsed.data.imageUrl ?? null),
      groupKey: parsed.data.groupKey ?? null,
    },
  });

  const actingUser = await prisma.user.findUnique({ where: { id: session.userId } });
  await logAudit({
    storeId: session.storeId,
    userId: session.userId,
    userName: actingUser?.name ?? "ไม่ทราบชื่อ",
    action: "product.create",
    entityType: "Product",
    entityId: product.id,
    summary: `เพิ่มสินค้า "${product.name}"`,
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  return null;
}

export type PackResult = { ok: true } | { ok: false; error: string };

const packSchema = z.object({
  productId: z.string().min(1),
  name: z.string().trim().min(1, "กรุณาเลือกหน่วยบรรจุ").max(30),
  size: z.coerce.number().int("จำนวนต่อหน่วยบรรจุต้องเป็นจำนวนเต็ม").min(2, "จำนวนต่อหน่วยบรรจุต้องมากกว่า 1"),
  barcode: z.string().trim().max(64).optional(),
  sellPrice: z.coerce.number().min(0, "ราคาขายต้องไม่ติดลบ").optional(),
});

function revalidateProductPages(productId: string) {
  for (const path of ["/inventory", `/inventory/${productId}`, "/stock", "/search", "/sell", "/receive", "/stock-take"]) {
    revalidatePath(path);
  }
}

/** Adds a packaging unit (ลัง, แพ็ค) to a product: how many base units it holds, and
 * optionally its own barcode and whole-pack price. */
export async function addPackAction(input: {
  productId: string;
  name: string;
  size: string;
  barcode?: string;
  sellPrice?: string;
}): Promise<PackResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const parsed = packSchema.safeParse({
    ...input,
    barcode: input.barcode?.trim() || undefined,
    sellPrice: input.sellPrice?.trim() || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, storeId: session.storeId },
    include: { packs: true },
  });
  if (!product) return { ok: false, error: "ไม่พบสินค้านี้" };
  if (parsed.data.name === product.unit) return { ok: false, error: `หน่วยบรรจุต้องไม่ซ้ำกับหน่วยนับ (${product.unit})` };
  if (product.packs.some((p) => p.name === parsed.data.name)) {
    return { ok: false, error: `สินค้านี้มีหน่วย "${parsed.data.name}" แล้ว ลบอันเดิมก่อนถ้าต้องการแก้` };
  }

  const barcode = parsed.data.barcode ?? null;
  if (barcode) {
    const owner = await barcodeOwner(session.storeId, barcode);
    if (owner) return { ok: false, error: `บาร์โค้ดนี้ใช้กับ "${owner}" อยู่แล้ว` };
  }

  await prisma.productPack.create({
    data: {
      storeId: session.storeId,
      productId: product.id,
      name: parsed.data.name,
      size: parsed.data.size,
      barcode,
      sellPrice: parsed.data.sellPrice ?? null,
    },
  });

  const actingUser = await prisma.user.findUnique({ where: { id: session.userId } });
  await logAudit({
    storeId: session.storeId,
    userId: session.userId,
    userName: actingUser?.name ?? "ไม่ทราบชื่อ",
    action: "product.pack_add",
    entityType: "Product",
    entityId: product.id,
    summary: `เพิ่มหน่วยบรรจุ "${product.name}" 1 ${parsed.data.name} = ${parsed.data.size} ${product.unit}`,
  });

  revalidateProductPages(product.id);
  return { ok: true };
}

export async function deletePackAction(packId: string): Promise<PackResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const pack = await prisma.productPack.findFirst({
    where: { id: packId, storeId: session.storeId },
    include: { product: { select: { name: true, unit: true } } },
  });
  if (!pack) return { ok: false, error: "ไม่พบหน่วยบรรจุนี้" };

  await prisma.productPack.delete({ where: { id: pack.id } });

  const actingUser = await prisma.user.findUnique({ where: { id: session.userId } });
  await logAudit({
    storeId: session.storeId,
    userId: session.userId,
    userName: actingUser?.name ?? "ไม่ทราบชื่อ",
    action: "product.pack_delete",
    entityType: "Product",
    entityId: pack.productId,
    summary: `ลบหน่วยบรรจุ "${pack.product.name}" 1 ${pack.name} = ${pack.size} ${pack.product.unit}`,
  });

  revalidateProductPages(pack.productId);
  return { ok: true };
}

const priceSchema = z.object({
  productId: z.string().min(1),
  sellPrice: z.coerce.number({ message: "กรุณากรอกราคาขาย" }).min(0, "ราคาขายต้องไม่ติดลบ"),
  costPrice: z.coerce.number({ message: "ราคาทุนต้องเป็นตัวเลข" }).min(0, "ราคาทุนต้องไม่ติดลบ"),
});

/** Sets a product's sell and cost price per base unit — e.g. for products added from
 * the catalog by a scan, which start at ฿0. */
export async function updateProductPriceAction(input: { productId: string; sellPrice: string; costPrice: string }): Promise<PackResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const parsed = priceSchema.safeParse({
    productId: input.productId,
    sellPrice: input.sellPrice.trim() || undefined,
    costPrice: input.costPrice.trim() || 0,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const product = await prisma.product.findFirst({ where: { id: parsed.data.productId, storeId: session.storeId } });
  if (!product) return { ok: false, error: "ไม่พบสินค้านี้" };

  await prisma.product.update({
    where: { id: product.id },
    data: { sellPrice: parsed.data.sellPrice, costPrice: parsed.data.costPrice },
  });

  const actingUser = await prisma.user.findUnique({ where: { id: session.userId } });
  await logAudit({
    storeId: session.storeId,
    userId: session.userId,
    userName: actingUser?.name ?? "ไม่ทราบชื่อ",
    action: "product.price_update",
    entityType: "Product",
    entityId: product.id,
    summary: `แก้ราคา "${product.name}" ขาย ฿${product.sellPrice} → ฿${parsed.data.sellPrice}, ทุน ฿${product.costPrice} → ฿${parsed.data.costPrice}`,
  });

  revalidateProductPages(product.id);
  return { ok: true };
}
