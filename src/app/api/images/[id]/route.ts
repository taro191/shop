import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** A product photo the store uploaded. Photos never change once saved (a new upload
 * gets a new id), so browsers may cache them for good. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await params;
  const image = await prisma.productImage.findFirst({ where: { id, storeId: session.storeId } });
  if (!image) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: { "Content-Type": image.mimeType, "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
